#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ucao-uut.tg}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin12345}"

log() {
  echo "[e2e] $1"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Commande requise manquante: $1"
    exit 1
  }
}

json_field() {
  local json="$1"
  local expr="$2"
  python3 -c 'import json,sys; data=json.loads(sys.argv[1]); expr=sys.argv[2]; print(eval(expr))' "$json" "$expr"
}

assert_success_true() {
  local json="$1"
  local ok
  ok=$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("success"))' "$json")
  if [[ "$ok" != "True" ]]; then
    echo "Requete attendue en succes mais echouee: $json"
    exit 1
  fi
}

assert_status_code() {
  local expected="$1"
  local actual="$2"
  if [[ "$expected" != "$actual" ]]; then
    echo "Code HTTP inattendu: attendu=$expected obtenu=$actual"
    exit 1
  fi
}

require_cmd curl
require_cmd python3

log "Health check"
health_code=$(curl -sS -o /tmp/votegbde-health.json -w "%{http_code}" "$BASE_URL/api/health")
assert_status_code "200" "$health_code"

log "Connexion admin"
login_json=$(curl -sS -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
assert_success_true "$login_json"
admin_token=$(json_field "$login_json" 'data["data"]["accessToken"]')

log "Creation scrutin SCHEDULED"
create_scrutin_json=$(curl -sS -X POST "$BASE_URL/api/admin/scrutins" \
  -H "Authorization: Bearer $admin_token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Scrutin E2E Flow","description":"Scenario e2e","startsAt":"2026-06-01T08:00:00.000Z","endsAt":"2026-06-01T12:00:00.000Z","status":"SCHEDULED"}')
assert_success_true "$create_scrutin_json"
scrutin_id=$(json_field "$create_scrutin_json" 'data["data"]["id"]')

log "Creation liste candidate"
create_list_json=$(curl -sS -X POST "$BASE_URL/api/admin/candidate-lists" \
  -H "Authorization: Bearer $admin_token" \
  -H "Content-Type: application/json" \
  -d "{\"scrutinId\":\"$scrutin_id\",\"name\":\"Liste E2E\",\"slogan\":\"Slogan E2E\",\"order\":1}")
assert_success_true "$create_list_json"

log "Stats participation (attendu 0 votant au debut)"
participation_json=$(curl -sS -H "Authorization: Bearer $admin_token" "$BASE_URL/api/admin/scrutins/$scrutin_id/participation")
assert_success_true "$participation_json"

log "Cloture scrutin"
close_scrutin_json=$(curl -sS -X PATCH "$BASE_URL/api/admin/scrutins/$scrutin_id" \
  -H "Authorization: Bearer $admin_token" \
  -H "Content-Type: application/json" \
  -d '{"status":"CLOSED"}')
assert_success_true "$close_scrutin_json"

log "Publication resultats"
publish_json=$(curl -sS -X POST "$BASE_URL/api/admin/scrutins/$scrutin_id/publish-results" \
  -H "Authorization: Bearer $admin_token")
assert_success_true "$publish_json"

log "Lecture resultats publics"
public_results_json=$(curl -sS "$BASE_URL/api/scrutin/$scrutin_id/results")
assert_success_true "$public_results_json"

log "Dashboard admin"
dashboard_json=$(curl -sS -H "Authorization: Bearer $admin_token" "$BASE_URL/api/admin/dashboard")
assert_success_true "$dashboard_json"

log "Scenario E2E termine avec succes"
echo "$public_results_json"
