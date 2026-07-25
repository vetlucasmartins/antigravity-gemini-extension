#!/usr/bin/env python3
"""
Antigravity IDE-to-Browser Extension Bridge Server v2.0.0
Dual High-Speed WebSocket (port 8766) + HTTP REST (port 8765) Bridge Server.
Provides <30ms latency for browser actions with full HTTP polling fallback.
"""

import sys
import json
import time
import queue
import threading
import asyncio
import websockets
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

HTTP_PORT = 8765
WS_PORT = 8766

command_queue = queue.Queue()
command_results = {}
results_lock = threading.Lock()
command_events = {}

ws_clients = set()
ws_loop = None
last_extension_ping = 0

# WebSocket Server Handler (Runs in background thread on port 8766)
async def ws_handler(websocket):
    global last_extension_ping
    ws_clients.add(websocket)
    last_extension_ping = time.time()
    print("⚡ Extensão Chrome conectada via WebSocket (Baixa Latência).")

    try:
        async for message in websocket:
            last_extension_ping = time.time()
            try:
                data = json.loads(message)
                cmd_id = data.get("id")
                result = data.get("result", {})

                if cmd_id:
                    with results_lock:
                        command_results[cmd_id] = result
                        event = command_events.get(cmd_id)
                        if event:
                            event.set()
            except Exception as e:
                print("Erro ao processar mensagem WS:", e)
    except Exception:
        pass
    finally:
        ws_clients.remove(websocket)
        print("Conexão WebSocket da extensão encerrada.")

def run_ws_server():
    global ws_loop
    ws_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(ws_loop)

    async def main():
        async with websockets.serve(ws_handler, "127.0.0.1", WS_PORT):
            print(f"⚡ Servidor WebSocket rodando em ws://127.0.0.1:{WS_PORT}...")
            await asyncio.Future()  # run forever

    try:
        ws_loop.run_until_complete(main())
    except Exception as e:
        print(f"Aviso WebSocket: {e}")

# HTTP Server Handler (Runs on port 8765)
class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
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
            is_connected = (time.time() - last_extension_ping) < 15 or len(ws_clients) > 0
            self.send_json({
                "status": "online",
                "http_port": HTTP_PORT,
                "ws_port": WS_PORT,
                "websocket_connected": len(ws_clients) > 0,
                "extension_connected": is_connected,
                "last_ping_seconds_ago": round(time.time() - last_extension_ping, 1) if last_extension_ping else None
            })
            return

        if self.path == '/api/history':
            try:
                import task_memory_logger
                history = task_memory_logger.get_recent_history(limit=20)
                self.send_json({"success": True, "history": history})
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, 500)
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

        if self.path == '/api/log':
            try:
                import task_memory_logger
                cat = payload.get("category", "Automação")
                prompt = payload.get("prompt", "")
                actions = payload.get("actions", "")
                status = payload.get("status", "Concluído")
                summary = payload.get("result_summary", "")
                url = payload.get("url", "")
                notes = payload.get("notes", "")

                task_id = task_memory_logger.log_task_entry(
                    category=cat,
                    prompt=prompt,
                    actions=actions,
                    status=status,
                    result_summary=summary,
                    url=url,
                    notes=notes
                )
                self.send_json({"success": True, "taskId": task_id})
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, 500)
            return

        if self.path == '/api/command':
            cmd_id = f"cmd_{int(time.time() * 1000)}"
            payload["id"] = cmd_id

            event = threading.Event()
            with results_lock:
                command_events[cmd_id] = event

            # Send via WebSocket if available for ultra-low latency (<30ms)
            if ws_clients and ws_loop:
                msg_str = json.dumps(payload, ensure_ascii=False)
                for client in list(ws_clients):
                    asyncio.run_coroutine_threadsafe(client.send(msg_str), ws_loop)
            else:
                # Fallback to HTTP polling queue
                command_queue.put(payload)

            # Wait for execution result (8 sec timeout)
            finished = event.wait(timeout=8.0)

            with results_lock:
                result = command_results.pop(cmd_id, None)
                command_events.pop(cmd_id, None)

            if finished and result is not None:
                try:
                    import task_memory_logger
                    action_name = payload.get("action", "COMMAND")
                    target = payload.get("target") or payload.get("url") or payload.get("selector") or ""
                    res_summary = f"Title: {result.get('title', '')} | URL: {result.get('url', '')}" if result.get('title') else json.dumps(result, ensure_ascii=False)[:100]
                    task_memory_logger.log_task_entry(
                        category=action_name,
                        prompt=f"Ação: {action_name}",
                        actions=f"Target: {target}",
                        status="Sucesso" if result.get("success", True) else "Falha",
                        result_summary=res_summary,
                        url=result.get("url", target)
                    )
                except Exception as log_err:
                    pass
                self.send_json(result)
            else:
                self.send_json({
                    "success": False,
                    "error": "Timeout aguardando resposta da extensão. Certifique-se de que a extensão Antigravity está ativa no Chrome."
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
    # Start WebSocket Server Thread
    ws_thread = threading.Thread(target=run_ws_server, daemon=True)
    ws_thread.start()

    # Start HTTP Server
    http_server = ThreadingHTTPServer(('127.0.0.1', HTTP_PORT), BridgeHandler)
    print(f"🚀 Antigravity Extension Bridge Server rodando na porta HTTP {HTTP_PORT} e WebSocket {WS_PORT}...")
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado.")
        http_server.server_close()

if __name__ == '__main__':
    run_server()
