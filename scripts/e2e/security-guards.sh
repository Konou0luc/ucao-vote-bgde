#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ucao-uut.tg}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin12345}"

log() {
  echo "[e2e-security] $1"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Commande requise manquante: $1"
    exit 1
  }
}

json_expr() {
  local json="$1"
  local expr="$2"
  python3 -c 'import json,sys; data=json.loads(sys.argv[1]); print(eval(sys.argv[2]))' "$json" "$expr"
}

assert_http_code() {
  local expected="$1"
  local got="$2"
  if [[ "$expected" != "$got" ]]; then
    echo "HTTP inattendu: attendu=$expected obtenu=$got"
    exit 1
  fi
}

assert_json_message_contains() {
  local json="$1"
  local text="$2"
  local msg
  msg=$(json_expr "$json" 'data.get("message", "")')
  if [[ "$msg" != *"$text"* ]]; then
    echo "Message inattendu: '$msg' (attendu contient '$text')"
    exit 1
  fi
}

require_cmd curl
require_cmd python3

log "1) Route admin protegee sans token -> 401"
admin_code=$(curl -sS -o /tmp/votegbde-admin-unauth.json -w "%{http_code}" "$BASE_URL/api/admin/dashboard")
assert_http_code "401" "$admin_code"

log "2) Login admin pour scenarios suivants"
login_json=$(curl -sS -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
token=$(json_expr "$login_json" 'data["data"]["accessToken"]')

log "2b) Normalisation: fermer un scrutin OPEN existant si besoin"
scrutins_json=$(curl -sS -H "Authorization: Bearer $token" "$BASE_URL/api/admin/scrutins")
open_id=$(json_expr "$scrutins_json" 'next((s["id"] for s in data.get("data", []) if s.get("status") == "OPEN"), "")')
if [[ -n "$open_id" ]]; then
  curl -sS -X PATCH "$BASE_URL/api/admin/scrutins/$open_id" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{"status":"CLOSED"}' >/tmp/votegbde-close-open.json
fi

log "3) Resultats publics avant publication -> 403"
create_json=$(curl -sS -X POST "$BASE_URL/api/admin/scrutins" \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Scrutin Guard Resultats","description":"not published yet","startsAt":"2026-07-01T08:00:00.000Z","endsAt":"2026-07-01T12:00:00.000Z","status":"SCHEDULED"}')
scrutin_id=$(json_expr "$create_json" 'data["data"]["id"]')

before_pub_code=$(curl -sS -o /tmp/votegbde-public-before.json -w "%{http_code}" "$BASE_URL/api/scrutin/$scrutin_id/results")
assert_http_code "403" "$before_pub_code"

log "4) Tentative double scrutin OPEN -> 409"
open1_json=$(curl -sS -X POST "$BASE_URL/api/admin/scrutins" \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Scrutin Guard Open A","startsAt":"2026-07-02T08:00:00.000Z","endsAt":"2026-07-02T12:00:00.000Z","status":"OPEN"}')

open1_success=$(json_expr "$open1_json" 'data.get("success")')
if [[ "$open1_success" != "True" ]]; then
  echo "Creation scrutin OPEN A impossible: $open1_json"
  exit 1
fi

open2_code=$(curl -sS -o /tmp/votegbde-open2.json -w "%{http_code}" -X POST "$BASE_URL/api/admin/scrutins" \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Scrutin Guard Open B","startsAt":"2026-07-03T08:00:00.000Z","endsAt":"2026-07-03T12:00:00.000Z","status":"OPEN"}')
assert_http_code "409" "$open2_code"

open2_json=$(cat /tmp/votegbde-open2.json)
assert_json_message_contains "$open2_json" "deja ouvert"

log "Scenario e2e securite termine avec succes"
echo "$open2_json"
