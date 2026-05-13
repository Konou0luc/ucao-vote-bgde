#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3010}"
PORT="${PORT:-3010}"

log() {
  echo "[pre-release] $1"
}

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

log "1) Build"
npm run build

log "2) Unit/integration baseline tests"
npm test

log "3) Start API server on port $PORT"
PORT="$PORT" npm run start >/tmp/votegbde-pre-release-server.log 2>&1 &
SERVER_PID=$!

for i in {1..20}; do
  if curl -sS "$BASE_URL/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
  if [[ "$i" == "20" ]]; then
    echo "Server not ready on $BASE_URL"
    exit 1
  fi
done

log "4) E2E business flow"
npm run test:e2e -- "$BASE_URL"

log "5) E2E security guards"
npm run test:e2e:security -- "$BASE_URL"

log "Pre-release checks passed successfully"
