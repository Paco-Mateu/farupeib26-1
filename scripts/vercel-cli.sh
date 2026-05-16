#!/usr/bin/env bash
# Run Vercel CLI from a global install when available, otherwise fall back to npx.

set -euo pipefail

if command -v vercel >/dev/null 2>&1; then
  exec vercel "$@"
fi

if command -v npx >/dev/null 2>&1; then
  exec npx vercel@latest "$@"
fi

echo "ERROR: neither 'vercel' nor 'npx' is available on PATH." >&2
exit 1
