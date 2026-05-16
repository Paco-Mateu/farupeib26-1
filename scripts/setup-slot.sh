#!/usr/bin/env bash
# Create or replace .env.local for slot 1, 2, or 3 with parallel-safe defaults.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLOT="${1:-}"
MONGO_URI="${2:-${MONGODB_URI:-${MONGODB_ATLAS_URI:-}}}"
PUBLIC_URL="${3:-}"

if [ -z "$SLOT" ]; then
  echo "Usage: bash scripts/setup-slot.sh <1|2|3> [mongo-uri] [public-demo-url]" >&2
  exit 1
fi

case "$SLOT" in
  1|2|3) ;;
  *)
    echo "ERROR: slot must be 1, 2, or 3." >&2
    exit 1
    ;;
esac

BACKEND_PORT=$((8000 + SLOT))
FRONTEND_PORT=$((3000 + SLOT))
DATABASE_NAME="proto${SLOT}"
PROJECT_NAME="FarupeIB 26 Prototype ${SLOT}"

if [ -z "$PUBLIC_URL" ]; then
  PUBLIC_URL="http://localhost:${FRONTEND_PORT}"
fi

PUBLIC_URL_PORTAL="${PUBLIC_URL%/}/pro"
PUBLIC_URL_APP="${PUBLIC_URL%/}/app"

cat > "$REPO_ROOT/.env.local" <<EOF
PROJECT_SLOT=${SLOT}
PROJECT_NAME="${PROJECT_NAME}"
APP_NAME=prototype-sprint-kit-${SLOT}
APP_ENV=development

BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
PORT=${FRONTEND_PORT}

MONGODB_URI="${MONGO_URI}"
DATABASE_NAME=${DATABASE_NAME}

OPENAI_API_KEY=""
OPENAI_CHAT_MODEL="gpt-5.4-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
VOYAGE_API_KEY_NAME=""
VOYAGE_API_KEY=""
VOYAGE_EMBEDDING_MODEL="voyage-4-lite"
VOYAGE_RERANK_MODEL="rerank-2.5-lite"

PUBLIC_DEMO_URL=${PUBLIC_URL}
PUBLIC_DEMO_URL_PORTAL=${PUBLIC_URL_PORTAL}
PUBLIC_DEMO_URL_APP=${PUBLIC_URL_APP}
NEXT_PUBLIC_DEMO_URL=${PUBLIC_URL}
NEXT_PUBLIC_DEMO_URL_PORTAL=${PUBLIC_URL_PORTAL}
NEXT_PUBLIC_DEMO_URL_APP=${PUBLIC_URL_APP}
NEXT_PUBLIC_PROJECT_NAME="${PROJECT_NAME}"
NEXT_PUBLIC_WAITLIST_HEADLINE="We are building this prototype live today."
NEXT_PUBLIC_WAITLIST_MESSAGE="Scan the code now, come back in two hours, and this page should feel completely different."
EOF

echo "Wrote $REPO_ROOT/.env.local"
echo "  Slot:          $SLOT"
echo "  Backend port:  $BACKEND_PORT"
echo "  Frontend port: $FRONTEND_PORT"
echo "  Database:      $DATABASE_NAME"
echo "  Public URL:    $PUBLIC_URL"
echo "  Pro URL:       $PUBLIC_URL_PORTAL"
echo "  App URL:       $PUBLIC_URL_APP"
