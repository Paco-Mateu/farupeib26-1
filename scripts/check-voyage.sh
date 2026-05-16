#!/usr/bin/env bash
# Validate Voyage embeddings and rerank before the contest starts.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  . "$REPO_ROOT/.env"
  set +a
fi

if [ -f "$REPO_ROOT/.env.local" ]; then
  set -a
  . "$REPO_ROOT/.env.local"
  set +a
fi

if [ -z "${VOYAGE_API_KEY:-}" ]; then
  echo "Voyage check failed: missing VOYAGE_API_KEY." >&2
  exit 1
fi

if [ -x "$REPO_ROOT/.venv/bin/python" ]; then
  PYTHON_BIN="$REPO_ROOT/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
else
  echo "ERROR: python3 is not installed or not on PATH." >&2
  exit 1
fi

"$PYTHON_BIN" - <<'PY'
import sys

from backend.providers import VoyageConfigurationError, VoyagePlatformClient

try:
    client = VoyagePlatformClient()
    result = client.validate_runtime()
    print(result)
except VoyageConfigurationError as exc:
    print(f"Voyage check failed: {exc}", file=sys.stderr)
    sys.exit(1)
except Exception as exc:
    print(f"Voyage runtime error: {exc}", file=sys.stderr)
    sys.exit(1)
PY
