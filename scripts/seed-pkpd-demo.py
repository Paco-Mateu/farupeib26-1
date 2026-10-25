#!/usr/bin/env python3
"""Seed the Xarxa PK/PD demo dataset directly into MongoDB.

Usage:
    python3 scripts/seed-pkpd-demo.py [--force]

Reads MONGODB_URI / DATABASE_NAME from .env.local (or the environment).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.services.xarxa_seed import seed_xarxa_demo


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="Drop and reseed all xarxa collections.")
    args = parser.parse_args()

    try:
        result = seed_xarxa_demo(force=args.force)
    except Exception as exc:  # noqa: BLE001 - operator-facing script
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
