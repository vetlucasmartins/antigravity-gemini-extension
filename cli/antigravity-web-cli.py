#!/usr/bin/env python3
"""
Antigravity Browser Agent - High-Performance CLI Bridge v2.0.0
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
        with urllib.request.urlopen(req, timeout=10) as response:
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
    parser = argparse.ArgumentParser(description="Antigravity Universal Browser Agent CLI Bridge v2.0")
    parser.add_argument("--status", action="store_true", help="Check Bridge Server and Extension connection status")
    parser.add_argument("--observe", action="store_true", help="Get synthetic A11y tree & visible interactive elements (ultra-lightweight)")
    parser.add_argument("--context", action="store_true", help="Get full active page context")
    parser.add_argument("--read", type=str, nargs="?", const="main", help="Read detailed text of a specific section or element ID (e1, main)")
    parser.add_argument("--click", type=str, help="Click element by short ID (e1, e2), text, or CSS selector")
    parser.add_argument("--type", type=str, help="Type text into input field")
    parser.add_argument("--target", type=str, help="Target element ID or selector for typing")
    parser.add_argument("--scroll", type=int, nargs="?", const=500, help="Scroll page (default 500px)")
    parser.add_argument("--batch", type=str, help="Execute JSON batch of actions (e.g. '[{\"action\":\"CLICK\",\"target\":\"e1\"}]')")
    parser.add_argument("--screenshot", action="store_true", help="Capture visible tab screenshot")

    args = parser.parse_args()

    if args.status:
        res = check_status()
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.observe:
        res = send_bridge_command({"action": "OBSERVE_STRUCTURE"})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.context:
        res = send_bridge_command({"action": "GET_PAGE_CONTEXT"})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.read is not None:
        res = send_bridge_command({"action": "READ_SECTION", "target": args.read})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.click:
        res = send_bridge_command({"action": "AUTOMATE_CLICK", "target": args.click})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.type:
        res = send_bridge_command({"action": "AUTOMATE_TYPE", "text": args.type, "target": args.target or ""})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.scroll:
        res = send_bridge_command({"action": "AUTOMATE_SCROLL", "distance": args.scroll})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    if args.batch:
        try:
            actions_list = json.loads(args.batch)
            res = send_bridge_command({"action": "BATCH_EXECUTE", "actions": actions_list})
            print(json.dumps(res, indent=2, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"success": False, "error": f"JSON de batch inválido: {e}"}))
        sys.exit(0)

    if args.screenshot:
        res = send_bridge_command({"action": "CAPTURE_VISIBLE_TAB"})
        print(json.dumps(res, indent=2, ensure_ascii=False))
        sys.exit(0)

    parser.print_help()

if __name__ == "__main__":
    main()
