#!/usr/bin/env bash
set -euo pipefail

VOTE_URL="${1:-http://localhost:3000}"
UCAO_URL="${2:-http://localhost:4000}"
API_KEY="${UCAO_API_KEY:-votegbde-ucao-shared-key-2026}"

log(){ echo "[inter-api] $1"; }

log "Verify endpoint rejects missing api key"
code=$(curl -sS -o /tmp/ucao-no-key.json -w "%{http_code}" "$UCAO_URL/api/students/verify/UCAO24A001")
if [[ "$code" != "401" ]]; then
  echo "Expected 401 without API key, got $code"
  exit 1
fi

log "Verify endpoint works with api key"
ok=$(curl -sS -H "x-api-key: $API_KEY" "$UCAO_URL/api/students/verify/UCAO24A001")
python3 -c 'import json,sys; j=json.loads(sys.argv[1]); assert j["success"] is True; assert j["data"]["exists"] is True' "$ok"

log "VoteBGDE OTP send for valid matricule"
otp_ok_code=$(curl -sS -o /tmp/vote-otp-ok.json -w "%{http_code}" -X POST "$VOTE_URL/api/otp/send" -H "Content-Type: application/json" -d '{"matricule":"UCAO24A001","email":"ama.kossi@ucao-uut.tg"}')
if [[ "$otp_ok_code" != "200" && "$otp_ok_code" != "409" ]]; then
  echo "Expected 200 or 409 for valid matricule, got $otp_ok_code"
  cat /tmp/vote-otp-ok.json
  exit 1
fi

log "VoteBGDE OTP send for unknown matricule"
otp_ko_code=$(curl -sS -o /tmp/vote-otp-ko.json -w "%{http_code}" -X POST "$VOTE_URL/api/otp/send" -H "Content-Type: application/json" -d '{"matricule":"UNKNOWN-999","email":"unknown@ucao-uut.tg"}')
if [[ "$otp_ko_code" != "404" ]]; then
  echo "Expected 404 for unknown matricule, got $otp_ko_code"
  cat /tmp/vote-otp-ko.json
  exit 1
fi

log "Inter-API flow checks passed"
