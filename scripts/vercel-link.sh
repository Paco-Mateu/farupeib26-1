#!/usr/bin/env bash
# Link this local repo to a Vercel project.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"
bash "$REPO_ROOT/scripts/vercel-cli.sh" link
