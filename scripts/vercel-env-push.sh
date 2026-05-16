#!/usr/bin/env bash
# Push local env values into the linked Vercel project.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-.env.local}"
shift || true

if [ ! -f "$REPO_ROOT/$ENV_FILE" ]; then
  echo "ERROR: env file not found: $ENV_FILE" >&2
  exit 1
fi

python3 "$REPO_ROOT/scripts/vercel-env-sync.py" --file "$ENV_FILE" "$@"
