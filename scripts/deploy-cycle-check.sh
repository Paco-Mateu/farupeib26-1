#!/usr/bin/env bash
# Verify the local and Vercel-facing deployment cycle for this repo.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_MODE="${1:-}"
RUN_REMOTE_BUILD=1
START_WRAPPER_PID=""
DEMO_RUNNING=0
CHECK_FAILURE=0
REMOTE_DEPLOYMENT_URL=""

wait_for_url() {
  local url="$1"
  local tries="${2:-60}"
  for ((i=0; i<tries; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "ERROR: timed out waiting for $url" >&2
  return 1
}

extract_vercel_url() {
  local log_file="$1"
  grep -Eo 'https://[^[:space:]]+\.vercel\.app' "$log_file" | tail -n 1
}

validate_remote_route() {
  local path="$1"
  local pattern="$2"
  if ! bash scripts/vercel-cli.sh curl "${REMOTE_DEPLOYMENT_URL}${path}" | rg -q "$pattern"; then
    echo "ERROR: remote validation failed for ${REMOTE_DEPLOYMENT_URL}${path}" >&2
    return 1
  fi
}

cleanup() {
  if [ "$DEMO_RUNNING" -eq 1 ]; then
    bash "$REPO_ROOT/scripts/stop-demo.sh" >/dev/null 2>&1 || true
    DEMO_RUNNING=0
  fi

  if [ -n "$START_WRAPPER_PID" ] && kill -0 "$START_WRAPPER_PID" >/dev/null 2>&1; then
    kill "$START_WRAPPER_PID" >/dev/null 2>&1 || true
    wait "$START_WRAPPER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

cd "$REPO_ROOT"

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

echo "1. Auditing secrets..."
python3 scripts/secret-audit.py

echo "1b. Checking OpenAI runtime..."
if [ -n "${OPENAI_API_KEY:-}" ]; then
  if ! npm run openai:check; then
    CHECK_FAILURE=1
  fi
else
  echo "SKIP: OPENAI_API_KEY is not set locally."
fi

echo "1c. Checking Voyage runtime..."
if [ -n "${VOYAGE_API_KEY:-}" ]; then
  if ! npm run voyage:check; then
    CHECK_FAILURE=1
  fi
else
  echo "SKIP: VOYAGE_API_KEY is not set locally."
fi

echo "2. Compiling Python..."
python3 -m py_compile api/index.py $(find backend -name '*.py' -print)

echo "3. Building Next.js..."
npm run build

echo "4. Starting local demo..."
bash scripts/start-demo.sh > logs/deploy-cycle.log 2>&1 &
START_WRAPPER_PID=$!
DEMO_RUNNING=1

for ((i=0; i<60; i++)); do
  if [ -f logs/pids/frontend.port ] && [ -f logs/pids/backend.port ]; then
    break
  fi
  sleep 1
done

if [ ! -f logs/pids/frontend.port ] || [ ! -f logs/pids/backend.port ]; then
  echo "ERROR: demo did not publish port files." >&2
  exit 1
fi

FRONTEND_PORT="$(cat logs/pids/frontend.port)"
BACKEND_PORT="$(cat logs/pids/backend.port)"

wait_for_url "http://127.0.0.1:${BACKEND_PORT}/api/health"
wait_for_url "http://127.0.0.1:${FRONTEND_PORT}/"
wait_for_url "http://127.0.0.1:${FRONTEND_PORT}/app"
wait_for_url "http://127.0.0.1:${FRONTEND_PORT}/pro"

echo "5. Verifying local routes..."
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/health" >/dev/null
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/" >/dev/null
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/app" >/dev/null
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/pro" >/dev/null

if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "5b. Verifying live OpenAI health through the app..."
  if ! curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/api/health/openai" >/dev/null; then
    CHECK_FAILURE=1
  fi
else
  echo "5b. Skipping live OpenAI health endpoint because OPENAI_API_KEY is not set."
fi

if [ -n "${VOYAGE_API_KEY:-}" ]; then
  echo "5c. Verifying live Voyage health through the app..."
  if ! curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/api/health/voyage" >/dev/null; then
    CHECK_FAILURE=1
  fi
else
  echo "5c. Skipping live Voyage health endpoint because VOYAGE_API_KEY is not set."
fi

echo "6. Stopping local demo..."
cleanup

echo "7. Checking Vercel link..."
if [ ! -f .vercel/project.json ]; then
  echo "SKIP: repo is not linked to a local Vercel project yet."
  RUN_REMOTE_BUILD=0
fi

if [ "$RUN_REMOTE_BUILD" -eq 1 ]; then
  echo "8. Pulling Vercel preview config..."
  bash scripts/vercel-cli.sh pull --environment=preview --yes

  echo "9. Running local Vercel build..."
  bash scripts/vercel-cli.sh build
fi

if [ "$REMOTE_MODE" = "--remote-preview" ]; then
  if [ "$RUN_REMOTE_BUILD" -eq 0 ]; then
    echo "ERROR: cannot deploy preview without a linked Vercel project." >&2
    exit 1
  fi
  echo "10. Creating remote preview deployment..."
  DEPLOY_LOG="$(mktemp)"
  bash scripts/vercel-cli.sh deploy --yes --no-color 2>&1 | tee "$DEPLOY_LOG"
  REMOTE_DEPLOYMENT_URL="$(extract_vercel_url "$DEPLOY_LOG")"
  rm -f "$DEPLOY_LOG"

  if [ -z "$REMOTE_DEPLOYMENT_URL" ]; then
    echo "ERROR: could not determine remote preview deployment URL." >&2
    exit 1
  fi

  echo "11. Verifying remote preview routes..."
  validate_remote_route "/" "We are building this prototype live today\\." || CHECK_FAILURE=1
  validate_remote_route "/app" "End-user portal" || CHECK_FAILURE=1
  validate_remote_route "/pro" "Professional portal" || CHECK_FAILURE=1
  validate_remote_route "/api/health" "\"service\":\"Prototype Sprint Kit API\"" || CHECK_FAILURE=1
fi

if [ "$REMOTE_MODE" = "--remote-production" ]; then
  if [ "$RUN_REMOTE_BUILD" -eq 0 ]; then
    echo "ERROR: cannot deploy production without a linked Vercel project." >&2
    exit 1
  fi
  echo "10. Creating remote production deployment..."
  DEPLOY_LOG="$(mktemp)"
  bash scripts/vercel-cli.sh deploy --prod --yes --no-color 2>&1 | tee "$DEPLOY_LOG"
  REMOTE_DEPLOYMENT_URL="$(extract_vercel_url "$DEPLOY_LOG")"
  rm -f "$DEPLOY_LOG"

  if [ -z "$REMOTE_DEPLOYMENT_URL" ]; then
    echo "ERROR: could not determine remote production deployment URL." >&2
    exit 1
  fi

  echo "11. Verifying remote production routes..."
  validate_remote_route "/" "We are building this prototype live today\\." || CHECK_FAILURE=1
  validate_remote_route "/app" "End-user portal" || CHECK_FAILURE=1
  validate_remote_route "/pro" "Professional portal" || CHECK_FAILURE=1
  validate_remote_route "/api/health" "\"service\":\"Prototype Sprint Kit API\"" || CHECK_FAILURE=1
fi

if [ "$CHECK_FAILURE" -ne 0 ]; then
  echo "Deployment cycle check found provider validation failures." >&2
  exit 1
fi

echo "Deployment cycle check passed."
