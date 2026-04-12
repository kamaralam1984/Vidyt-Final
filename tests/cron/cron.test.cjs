const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/viralboost_ai_integration_test_cron';
process.env.CRON_SECRET = process.env.CRON_SECRET || 'cron_test_secret';

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

const mongoose = require('mongoose');
const { createMockNextRequest } = require('../utils/mockNextRequest.cjs');

const connectDB = require('../../lib/mongodb.ts').default || require('../../lib/mongodb.ts');
const ViralPrediction = require('../../models/ViralPrediction.ts').default || require('../../models/ViralPrediction.ts');

const aiRetrainRoute = require('../../app/api/cron/ai-retrain/route.ts');
const syncOutcomesRoute = require('../../app/api/cron/sync-prediction-outcomes/route.ts');

async function resetDb() {
  await connectDB();
  await mongoose.connection.dropDatabase();
}

test('cron: ai-retrain rejects unauthorized', async () => {
  await resetDb();

  const req = createMockNextRequest({
    body: {},
    headers: { authorization: 'Bearer wrong_secret' },
  });
  const res = await aiRetrainRoute.POST(req);
  assert.equal(res.status, 401);
});

test('cron: ai-retrain enqueues training job with stats', async () => {
  await resetDb();

  const req = createMockNextRequest({
    body: {},
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const res = await aiRetrainRoute.POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.jobId);
  assert.equal(data.stats.total, 1);
});

test('cron: sync-prediction-outcomes returns success stats (no external call when already labeled)', async () => {
  await resetDb();

  await ViralPrediction.create({
    userId: 'user1',
    videoId: 'vid_labeled_1',
    platform: 'youtube',
    viralProbability: 50,
    confidence: 50,
    features: {},
    sourceProvider: 'internal_ensemble',
    modelVersion: 'v0',
    outcome: {
      viralScore0to100: 55,
      views: 100,
      likes: 10,
      comments: 1,
      capturedAt: new Date(),
      source: 'cron_sync',
    },
  });

  const req = createMockNextRequest({
    body: { batchSize: 25, minAgeHours: 24 },
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  const res = await syncOutcomesRoute.POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.updated, 0);
  assert.equal(data.stats.failures, 0);
});

