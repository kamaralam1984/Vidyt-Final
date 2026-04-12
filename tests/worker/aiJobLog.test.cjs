const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

process.env.NODE_ENV = 'test';
process.env.TS_NODE_PROJECT = path.resolve(__dirname, '../..', 'tsconfig.json');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  moduleResolution: 'node',
  module: 'commonjs',
});
process.env.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/viralboost_ai_integration_test_worker';
process.env.AI_QUEUE_NAME = process.env.AI_QUEUE_NAME || `ai-jobs-test-${Date.now()}`;

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

const connectDB = require('../../lib/mongodb.ts').default || require('../../lib/mongodb.ts');
const { enqueueAiJob } = require('../../lib/queue.ts');
const { closeAiQueue } = require('../../lib/queue.ts');
const AIJobLog = require('../../models/AIJobLog.ts').default || require('../../models/AIJobLog.ts');

async function resetDb() {
  await connectDB();
  await mongoose.connection.dropDatabase();
}

test('worker queue: enqueueAiJob uses idempotencyKey to avoid duplicate jobs/logs', async () => {
  await resetDb();

  const payload = {
    jobType: 'prediction',
    userId: 'user_1',
    data: { predictionId: 'pred_1', provider: 'internal_ensemble', viralProbability: 50, confidence: 50 },
    idempotencyKey: 'idem-pred-user_1',
  };

  const j1 = await enqueueAiJob(payload);
  const j2 = await enqueueAiJob(payload);

  assert.ok(j1 && j1.id);
  assert.equal(String(j1.id), String(j2.id));

  const logs = await AIJobLog.find({ queueJobId: String(j1.id) }).lean();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].status, 'queued');

  await closeAiQueue();
  await mongoose.connection.close();
});

