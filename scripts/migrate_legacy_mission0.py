"""Idempotent operator tooling for importing canonical unresolved V1 Mission 0.

This script is deliberately not part of the frontend or contract authority. It
only invokes the pinned CLI, rereads both contracts, and aborts on mismatches.
"""
import json
import os
import subprocess
import sys

LEGACY = "0x97C9AB9afd4dCC03cAeF693cc5c8E93A7Db0395e"
EXPECTED_SHA = "82bee53969172af1fcfa575fe4605fb18c974017"
EXPECTED_POOL = 10 * 10**18


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


def read(address, method, *args):
    return json_tail(cli("call", address, method, "--args", *[str(arg) for arg in args]))


def main():
    address = os.environ.get("MOSAIC_V2_ADDRESS")
    if not address:
        raise SystemExit("MOSAIC_V2_ADDRESS is required")
    legacy = json.loads(read(LEGACY, "get_mission", 0))
    if legacy.get("status") != "TERMINAL_FROZEN" or legacy.get("settlement") not in (None, ""):
        raise SystemExit("legacy mission is not unresolved TERMINAL_FROZEN")
    if legacy.get("terminal_tip_sha", "").lower() != EXPECTED_SHA:
        raise SystemExit("legacy terminal SHA mismatch")
    if int(legacy.get("total_funded_wei", 0)) != EXPECTED_POOL:
        raise SystemExit("legacy pool mismatch")
    print(json.dumps({"legacy": LEGACY, "mission": 0, "terminal_tip_sha": EXPECTED_SHA, "pool_wei": EXPECTED_POOL}, indent=2))
    print("Ready: submit import_legacy_frozen_mission(0) with exactly 10 GEN using the active CLI account.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"migration aborted: {exc}", file=sys.stderr)
        raise SystemExit(1)
