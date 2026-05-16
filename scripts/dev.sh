#!/usr/bin/env bash
# Run frontend and backend together in the foreground using the slot-aware env config.

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

PROJECT_SLOT="${PROJECT_SLOT:-1}"
export BACKEND_PORT="${BACKEND_PORT:-$((8000 + PROJECT_SLOT))}"
export FRONTEND_PORT="${FRONTEND_PORT:-${PORT:-$((3000 + PROJECT_SLOT))}}"
export INTERNAL_BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"

cd "$REPO_ROOT"
./node_modules/.bin/concurrently "npm run next-dev" "npm run fastapi-dev"
