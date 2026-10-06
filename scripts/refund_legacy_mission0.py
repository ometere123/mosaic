"""Idempotent V1 Mission 0 expiry/refund readiness check."""
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

LEGACY = "0x97C9AB9afd4dCC03cAeF693cc5c8E93A7Db0395e"


def cli(*args):
    result = subprocess.run(["npx", "--no-install", "genlayer", *args], text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return result.stdout


def json_tail(text):
    for line in reversed(text.splitlines()):
        try:
            return json.loads(line)
        except json.JSONDecodeError:
            continue
    raise RuntimeError("CLI did not return JSON")


def main():
    mission = json_tail(cli("call", LEGACY, "get_mission", "--args", "0"))
    if mission.get("status") != "TERMINAL_FROZEN" or mission.get("settlement") not in (None, ""):
        print("legacy mission is already settled/expired or unavailable; no action")
        return
    eligible = int(datetime.now(timezone.utc).timestamp()) > int(mission["freeze_not_before"]) + 30 * 24 * 60 * 60
    if not eligible:
        earliest = int(mission["freeze_not_before"]) + 30 * 24 * 60 * 60
        print(json.dumps({"eligible": False, "earliest_eligible_unix": earliest}))
        return
    print("Eligible. Operator must submit expire_unresolved(0), then withdraw the sponsor balance through the pinned CLI.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"refund check aborted: {exc}", file=sys.stderr)
        raise SystemExit(1)
