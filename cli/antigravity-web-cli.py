#!/usr/bin/env python3
"""
Antigravity Browser Agent - CLI Bridge v2.0.0
Allows Antigravity subagents, apps, or shell CLI commands to send actions directly
to the Chrome Browser Extension via http://localhost:8765
"""

import sys
import json
import argparse
import urllib.request
import urllib.error

BRIDGE_URL = "http://127.0.0.1:8765"

def send_bridge_command(command_payload):
    url = f"{BRIDGE_URL}/api/command"
    req = urllib.request.Request(
        url,
        data=json.dumps(command_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=14) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return {"success": False, "error": f"HTTP Error {e.code}: {e.read().decode('utf-8')}"}
    except Exception as e:
        return {"success": False, "error": f"Não foi possível conectar ao servidor bridge (localhost:8765): {e}"}

def check_status():
    url = f"{BRIDGE_URL}/status"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=3) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {"status": "offline", "error": str(e)}

def main():
    parser = argparse.ArgumentParser(description="Antigravity Browser Agent CLI Bridge v2.0")
    parser.add_argument("--status", action="store_true", help="Check Bridge Server and Extension connection status")
    parser.add_argument("--context", action="store_true", help="Get active browser page context (Title, URL, DOM text)")
    parser.add_argument("--click", type=str, help="Click element matching text or selector")
    parser.add_argument("--type", type=str, help="Type text into active input field")
    parser.add_argument("--target", type=str, help="CSS selector for target element when typing")
    parser.add_argument("--scroll", type=int, nargs="?", const=500, help="Scroll page (default 500px)")
    parser.add_argument("--screenshot", action="store_true", help="Capture visible tab screenshot")

    args = parser.parse_args()

    if args.status:
        res = check_status()
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.context:
        res = send_bridge_command({"action": "GET_PAGE_CONTEXT"})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.click:
        res = send_bridge_command({"action": "AUTOMATE_CLICK", "target": args.click})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.type:
        res = send_bridge_command({"action": "AUTOMATE_TYPE", "text": args.type, "selector": args.target or ""})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.scroll:
        res = send_bridge_command({"action": "AUTOMATE_SCROLL", "distance": args.scroll})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.screenshot:
        res = send_bridge_command({"action": "CAPTURE_VISIBLE_TAB"})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    parser.print_help()

if __name__ == "__main__":
    main()
