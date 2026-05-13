const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
const USERS = Number(process.env.LOAD_USERS || 100);

const matricules = Array.from({ length: 200 }, (_, i) => `UCAODEMO${String(i + 1).padStart(3, "0")}`);

function nowMs() { return Number(process.hrtime.bigint() / 1000000n); }

async function jsonFetch(path, body) {
  const started = nowMs();
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    payload,
    latencyMs: nowMs() - started,
  };
}

async function oneUser(i) {
  const matricule = matricules[i % matricules.length];
  const email = `loadtest+${i}@example.com`;

  const send = await jsonFetch('/otp/send', { matricule, email });
  if (!send.ok) {
    return { phase: 'send', ...send };
  }

  const data = send.payload?.data || {};
  const sessionToken = data.sessionToken;
  const debugOtp = data.debugOtp;

  if (!sessionToken || !debugOtp) {
    return {
      phase: 'send',
      ok: false,
      status: 500,
      payload: { message: 'Missing sessionToken/debugOtp in send response' },
      latencyMs: send.latencyMs,
    };
  }

  const verify = await jsonFetch('/otp/verify', { sessionToken, otp: debugOtp });
  return { phase: 'verify', send, verify };
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  const started = nowMs();
  const results = await Promise.all(Array.from({ length: USERS }, (_, i) => oneUser(i)));

  const sendLat = [];
  const verifyLat = [];
  const counts = {
    sendOk: 0,
    sendFail: 0,
    verifyOk: 0,
    verifyFail: 0,
  };

  for (const r of results) {
    if (r.phase === 'send') {
      sendLat.push(r.latencyMs || 0);
      if (r.ok) counts.sendOk += 1; else counts.sendFail += 1;
      continue;
    }

    sendLat.push(r.send.latencyMs || 0);
    if (r.send.ok) counts.sendOk += 1; else counts.sendFail += 1;

    verifyLat.push(r.verify.latencyMs || 0);
    if (r.verify.ok) counts.verifyOk += 1; else counts.verifyFail += 1;
  }

  const elapsed = nowMs() - started;

  console.log(JSON.stringify({
    users: USERS,
    elapsedMs: elapsed,
    throughputUsersPerSec: Number((USERS / (elapsed / 1000)).toFixed(2)),
    counts,
    sendLatency: {
      avg: Number((sendLat.reduce((a, b) => a + b, 0) / Math.max(sendLat.length, 1)).toFixed(2)),
      p95: percentile(sendLat, 95),
      p99: percentile(sendLat, 99),
      max: Math.max(...sendLat, 0),
    },
    verifyLatency: {
      avg: Number((verifyLat.reduce((a, b) => a + b, 0) / Math.max(verifyLat.length, 1)).toFixed(2)),
      p95: percentile(verifyLat, 95),
      p99: percentile(verifyLat, 99),
      max: Math.max(...verifyLat, 0),
    },
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
