#!/usr/bin/env python3
"""
Antigravity IDE-to-Browser Extension Bridge Server v1.0.0
Runs a lightweight HTTP server on localhost:8765 to bridge IDE commands
directly to the Chrome Extension and active browser tabs.
"""

import sys
import json
import time
import queue
import threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

PORT = 8765
command_queue = queue.Queue()
command_results = {}
results_lock = threading.Lock()
command_events = {}

last_extension_ping = 0

class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Quiet standard logging unless error
        pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        global last_extension_ping
        if self.path == '/status':
            is_connected = (time.time() - last_extension_ping) < 15
            self.send_json({
                "status": "online",
                "port": PORT,
                "extension_connected": is_connected,
                "last_ping_seconds_ago": round(time.time() - last_extension_ping, 1) if last_extension_ping else None
            })
            return

        if self.path == '/extension/poll':
            last_extension_ping = time.time()
            try:
                cmd = command_queue.get(timeout=8.0)
                self.send_json({"hasCommand": True, "command": cmd})
            except queue.Empty:
                self.send_json({"hasCommand": False})
            return

        self.send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        global last_extension_ping
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length)
        
        try:
            payload = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
        except Exception as e:
            self.send_json({"error": "Invalid JSON body"}, 400)
            return

        if self.path == '/api/command':
            cmd_id = f"cmd_{int(time.time() * 1000)}"
            payload["id"] = cmd_id

            event = threading.Event()
            with results_lock:
                command_events[cmd_id] = event

            command_queue.put(payload)

            # Wait for extension execution result (12 sec timeout)
            finished = event.wait(timeout=12.0)

            with results_lock:
                result = command_results.pop(cmd_id, None)
                command_events.pop(cmd_id, None)

            if finished and result is not None:
                self.send_json(result)
            else:
                self.send_json({
                    "success": False,
                    "error": "Timeout aguardando resposta da extensão no Chrome. Verifique se a extensão está rodando no navegador."
                }, 504)
            return

        if self.path == '/extension/response':
            last_extension_ping = time.time()
            cmd_id = payload.get("id")
            if cmd_id:
                with results_lock:
                    command_results[cmd_id] = payload.get("result", {})
                    event = command_events.get(cmd_id)
                    if event:
                        event.set()
                self.send_json({"success": True})
            else:
                self.send_json({"error": "Missing command ID"}, 400)
            return

        self.send_json({"error": "Endpoint not found"}, 404)

def run_server():
    server = ThreadingHTTPServer(('127.0.0.1', PORT), BridgeHandler)
    print(f"🚀 Antigravity Extension Bridge Server rodando na porta {PORT}...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado.")
        server.server_close()

if __name__ == '__main__':
    run_server()
