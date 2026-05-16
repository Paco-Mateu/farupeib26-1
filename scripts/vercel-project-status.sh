#!/usr/bin/env bash
# Show local Vercel project linkage details when available.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_FILE="$REPO_ROOT/.vercel/project.json"

if [ ! -f "$PROJECT_FILE" ]; then
  echo "No local Vercel link found for this repo."
  echo "Next step: run 'bash scripts/vercel-link.sh' or 'npx vercel@latest link'."
  exit 0
fi

python3 - <<'PY' "$PROJECT_FILE"
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text())
print(f"Linked Vercel project:")
print(f"  projectId: {data.get('projectId')}")
print(f"  orgId:     {data.get('orgId')}")
print(f"  path:      {path}")
PY
