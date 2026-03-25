const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const mongoose = require('mongoose');

const { v4: uuidv4 } = require('uuid');

process.env.NODE_ENV = 'test';
process.env.TS_NODE_PROJECT = path.resolve(__dirname, '../..', 'tsconfig.json');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  moduleResolution: 'node',
  module: 'commonjs',
});
process.env.MONGODB_URI_TEST =
  process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/viralboost_ai_tracking_worker_test';
process.env.REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

process.env.TRACKING_QUEUE_NAME = process.env.TRACKING_QUEUE_NAME || `tracking-events-test-${Date.now()}`;
process.env.TRACKING_WORKER_START = 'false'; // we'll start manually in test
process.env.TRACKING_FLUSH_INTERVAL_MS = process.env.TRACKING_FLUSH_INTERVAL_MS || '100';
process.env.TRACKING_MAX_BATCH_SIZE = process.env.TRACKING_MAX_BATCH_SIZE || '50';
process.env.TRACKING_BACKLOG_CHECK_MS = process.env.TRACKING_BACKLOG_CHECK_MS || '600000';
process.env.TRACKING_BACKLOG_ALERT_THRESHOLD = process.env.TRACKING_BACKLOG_ALERT_THRESHOLD || '1000000';

// Map "@/..." imports to the project root for ts-node-based route imports.
const projectRoot = path.resolve(__dirname, '../..');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    const rel = request.slice(2).replace(/^\//, '');
    request = path.join(projectRoot, rel);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require('ts-node/register/transpile-only');

const connectDB = require('../../lib/mongodb.ts').default || require('../../lib/mongodb.ts');
const { enqueueTrackingEvent, closeTrackingQueue } = require('../../lib/trackingQueue.ts');
const TrackingLog = require('../../models/TrackingLog.ts').default || require('../../models/TrackingLog.ts');
const UserSession = require('../../models/UserSession.ts').default || require('../../models/UserSession.ts');
const { startTrackingWorker } =
  require('../../workers/trackingWorker.ts');
const { disconnectRedis } = require('../../lib/redis.ts');

async function resetDb() {
  await connectDB();
  await mongoose.connection.dropDatabase();
}

async function waitFor(fn, { timeoutMs = 10_000, intervalMs = 100 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const ok = await fn();
      if (ok) return;
    } catch {
      // ignore
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitFor timeout');
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

test('tracking worker: idempotent by eventId', async () => {
  await resetDb();

  const worker = startTrackingWorker({ concurrency: 1 });

  const userId = new mongoose.Types.ObjectId().toString();
  const sessionId = `sid_${uuidv4()}`;
  const timestamp = new Date('2026-01-01T00:00:00.000Z').toISOString();
  const eventId = uuidv4();

  const payload = {
    eventId,
    userId,
    sessionId,
    timestamp,
    normalizedAction: 'page',
    page: '/test',
    previousPage: '/prev',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };

  // Enqueue duplicates.
  for (let i = 0; i < 20; i++) {
    // eslint-disable-next-line no-await-in-loop
    await enqueueTrackingEvent(payload);
  }

  await waitFor(async () => {
    const logCount = await TrackingLog.countDocuments({ eventId });
    const sessionCountNow = await UserSession.countDocuments({ sessionId });
    return logCount === 1 && sessionCountNow === 1;
  });

  const sessionCount = await UserSession.countDocuments({ sessionId });
  assert.equal(sessionCount, 1);

  await worker.close();
  await disconnectRedis();
  await mongoose.connection.close();
  await closeTrackingQueue();
});

test('tracking worker: batches many events without duplicates', async () => {
  await resetDb();

  const worker = startTrackingWorker({ concurrency: 2 });

  const userId = new mongoose.Types.ObjectId().toString();
  const sessionId = `sid_${uuidv4()}`;
  const baseTs = new Date('2026-01-01T00:00:00.000Z').getTime();

  const events = [];
  const total = 120;
  for (let i = 0; i < total; i++) {
    events.push({
      eventId: uuidv4(),
      userId,
      sessionId,
      timestamp: new Date(baseTs + i).toISOString(),
      normalizedAction: 'page',
      page: `/p/${i % 5}`,
      previousPage: '/prev',
      ipAddress: '127.0.0.1',
    });
  }

  for (const e of events) {
    // eslint-disable-next-line no-await-in-loop
    await enqueueTrackingEvent(e);
  }

  await waitFor(async () => {
    const count = await TrackingLog.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    return count === total;
  }, { timeoutMs: 20_000, intervalMs: 150 });

  await worker.close();
  await disconnectRedis();
  await mongoose.connection.close();
  await closeTrackingQueue();
});

test('tracking worker: handles high-concurrency enqueue (1000 unique events)', async () => {
  await resetDb();

  const worker = startTrackingWorker({ concurrency: 5 });

  const userId = new mongoose.Types.ObjectId().toString();
  const sessionId = `sid_${uuidv4()}`;
  const baseTs = new Date('2026-01-01T00:00:00.000Z').getTime();

  const total = 1000;
  const events = Array.from({ length: total }).map((_, i) => ({
    eventId: uuidv4(),
    userId,
    sessionId,
    timestamp: new Date(baseTs + i).toISOString(),
    normalizedAction: 'page',
    page: `/c/${i % 20}`,
    previousPage: '/prev',
    ipAddress: '127.0.0.1',
  }));

  // Enqueue in parallel to simulate concurrent producers.
  await Promise.all(
    events.map((e) => enqueueTrackingEvent(e))
  );

  await waitFor(async () => {
    const count = await TrackingLog.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    return count === total;
  }, { timeoutMs: 30_000, intervalMs: 200 });

  await worker.close();
  await disconnectRedis();
  await mongoose.connection.close();
  await closeTrackingQueue();
});

