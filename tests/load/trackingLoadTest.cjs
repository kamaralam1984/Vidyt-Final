/**
 * Simple load test for /api/admin/super/tracking
 *
 * Usage:
 *   TRACKING_BASE_URL=http://localhost:3000 TRACKING_TOKEN=... node tests/load/trackingLoadTest.cjs
 */
const assert = require('node:assert/strict');

const BASE_URL = process.env.TRACKING_BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TRACKING_TOKEN || '';
const TOTAL = Number(process.env.TRACKING_TOTAL || 2000);
const CONCURRENCY = Number(process.env.TRACKING_CONCURRENCY || 200);

if (!TOKEN) {
  console.error('Missing TRACKING_TOKEN env var');
  process.exit(1);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postOne(i) {
  // Keep sessionId stable to validate idempotency & session update safety.
  const sid = `load_sid_${Math.floor(i / 10)}`; // 10 events per logical session bucket
  const page = `/load/p/${i}`;

  // Send a timestamp with second precision so producer-side eventId dedupe works.
  const ts = new Date(Date.now() + randInt(-900, 900));
  ts.setMilliseconds(0);

  const res = await fetch(`${BASE_URL}/api/admin/super/tracking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      action: 'page',
      page,
      previousPage: '/prev',
      sessionId: sid,
      timestamp: ts.toISOString(),
    }),
  });

  if (res.status !== 200) {
    const body = await res.text().catch(() => '');
    throw new Error(`request failed status=${res.status} body=${body}`);
  }
  const json = await res.json();
  assert.equal(json.success, true);
}

async function main() {
  const startedAt = Date.now();
  let idx = 0;
  let failures = 0;

  const workers = Array.from({ length: CONCURRENCY }).map(async () => {
    while (true) {
      const cur = idx;
      idx += 1;
      if (cur >= TOTAL) return;
      try {
        await postOne(cur);
      } catch (e) {
        failures += 1;
        console.error('[loadTest] failure', { i: cur, err: e instanceof Error ? e.message : String(e) });
      }
    }
  });

  await Promise.all(workers);

  const elapsedMs = Date.now() - startedAt;
  console.log(
    JSON.stringify({
      ok: failures === 0,
      failures,
      total: TOTAL,
      concurrency: CONCURRENCY,
      elapsedMs,
      rps: Math.round((TOTAL / elapsedMs) * 1000),
    })
  );

  // Give the tracking worker time to flush remaining events (optional).
  await sleep(1500);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

