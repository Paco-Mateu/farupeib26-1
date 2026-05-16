#!/usr/bin/env bash
# Install local git hooks for secret protection in this repo.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

chmod +x "$REPO_ROOT/.githooks/pre-commit" "$REPO_ROOT/.githooks/pre-push"
git -C "$REPO_ROOT" config core.hooksPath .githooks
echo "Configured git hooks path: .githooks"
