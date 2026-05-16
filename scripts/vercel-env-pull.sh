#!/usr/bin/env bash
# Pull environment variables from the linked Vercel project into a local file.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-development}"
TARGET_FILE="${2:-.env.vercel.${ENVIRONMENT}.local}"

case "$ENVIRONMENT" in
  development|preview|production) ;;
  *)
    echo "ERROR: environment must be development, preview, or production." >&2
    exit 1
    ;;
esac

if [ ! -f "$REPO_ROOT/.vercel/project.json" ]; then
  echo "ERROR: this repo is not linked to a Vercel project locally. Run 'bash scripts/vercel-link.sh' first." >&2
  exit 1
fi

cd "$REPO_ROOT"
bash "$REPO_ROOT/scripts/vercel-cli.sh" env pull "$TARGET_FILE" --environment="$ENVIRONMENT" --yes
