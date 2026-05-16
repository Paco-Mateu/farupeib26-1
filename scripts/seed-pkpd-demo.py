#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.services.pkpd_seed import ensure_pkpd_demo_dataset


def main() -> None:
    result = ensure_pkpd_demo_dataset()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
