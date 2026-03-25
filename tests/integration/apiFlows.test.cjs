const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';

// Ensure ts-node uses the correct compiler config for our CJS test runner.
process.env.TS_NODE_PROJECT = path.resolve(__dirname, '../..', 'tsconfig.json');
// tsconfig.json uses moduleResolution: "bundler", which ts-node sometimes
// conflicts with under CJS runners (TS5095). Override to a stable resolver.
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  moduleResolution: 'node',
  module: 'esnext',
});
require('ts-node/register/transpile-only');

// Next dev server loads secrets from `.env.local`. Mirror the same values here
// so the JWT we generate matches what Next middleware verifies.
const envLocalPath = path.resolve(__dirname, '../..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const txt = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of txt.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (
      ['JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'].includes(key)
    ) {
      process.env[key] = val;
    }
  }
}

process.env.RAZORPAY_MOCK = 'true';
process.env.AI_TEST_MODE = 'true';
process.env.AI_PYTHON_TEST_MODE = 'down';
process.env.AI_PREDICTION_QUEUE_ENABLED = 'false';

// Ensure the test runner connects to the exact same MongoDB as the spawned Next server.
process.env.MONGODB_URI_TEST =
  process.env.MONGODB_URI_TEST ||
  'mongodb://localhost:27017/viralboost_ai_integration_test_api_flows';

// Validate retry logic once during the first payment verification attempt.
process.env.TEST_FAILPOINT = 'payment_db_write';

// Make middleware accept test auth reliably.
process.env.ENABLE_TEST_AUTH_HEADER = 'true';

const { startNextServer } = require('./nextServer.cjs');
const { generateToken } = require('../../lib/auth-jwt.ts');
const connectDB = require('../../lib/mongodb.ts').default || require('../../lib/mongodb.ts');

const User = require('../../models/User.ts').default || require('../../models/User.ts');
const Plan = require('../../models/Plan.ts').default || require('../../models/Plan.ts');
const Payment = require('../../models/Payment.ts').default || require('../../models/Payment.ts');
const ViralPrediction = require('../../models/ViralPrediction.ts').default || require('../../models/ViralPrediction.ts');

let server;

test.before(async () => {
  server = await startNextServer({
    port: 3011,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: process.env.JWT_SECRET,
      MONGODB_URI_TEST:
        process.env.MONGODB_URI_TEST ||
        'mongodb://localhost:27017/viralboost_ai_integration_test_api_flows',

      RAZORPAY_MOCK: 'true',
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

      AI_TEST_MODE: 'true',
      AI_PYTHON_TEST_MODE: 'down',
      AI_PREDICTION_QUEUE_ENABLED: 'false',

      TEST_FAILPOINT: process.env.TEST_FAILPOINT,
      ENABLE_TEST_AUTH_HEADER: 'true',
    },
  });
});

test.after(async () => {
  if (server) await server.stop();
});

async function resetDb() {
  await connectDB();
  await mongoose.connection.dropDatabase();
}

function hmacHex(secret, data) {
  return crypto.createHmac('sha256', secret).update(String(data)).digest('hex');
}

async function seedPlanAndUser() {
  await Plan.create({
    planId: 'pro',
    name: 'Pro',
    label: 'Pro Plan',
    priceMonthly: 15,
    priceYearly: 150,
    currency: 'USD',
    features: [],
    isActive: true,
    isCustom: false,
    billingPeriod: 'both',
    role: 'manager',
  });

  const user = await User.create({
    email: `buyer_${Date.now()}@example.com`,
    name: 'Buyer',
    subscription: 'free',
    role: 'user',
    usageStats: {
      videosAnalyzed: 0,
      analysesThisMonth: 0,
      competitorsTracked: 0,
      hashtagsGenerated: 0,
    },
  });

  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: 'user',
    subscription: 'free',
  });

  return { user, token };
}

test('payments: create-order -> verify-payment (charged correctness + idempotency + duplicate webhook safety)', async () => {
  await resetDb();
  const { user, token } = await seedPlanAndUser();

  const authQuery = `test_token=${encodeURIComponent(token)}`;

  const orderRes = await fetch(
    `${server.baseUrl}/api/payments/create-order?${authQuery}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan: 'pro', billingPeriod: 'month', currency: 'INR' }),
    }
  );
  assert.equal(orderRes.status, 200);
  const order = await orderRes.json();
  assert.equal(order.currency, 'INR');
  assert.equal(order.plan, 'pro');

  const orderId = order.id;
  const paymentId = `pay_mock_for_${orderId}`;
  const verifySignature = hmacHex(
    process.env.RAZORPAY_KEY_SECRET,
    `${orderId}|${paymentId}`
  );

  const verifyPayload = {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: verifySignature,
    plan: 'pro',
    billingPeriod: 'month',
    amountMinor: order.amount,
    currency: order.currency,
  };

  const verifyRes1 = await fetch(
    `${server.baseUrl}/api/payments/verify-payment?${authQuery}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(verifyPayload),
    }
  );
  assert.equal(verifyRes1.status, 200);
  const verify1 = await verifyRes1.json();
  assert.equal(verify1.success, true);

  const dbAfter1 = await User.findById(user._id).select(
    'subscriptionPlan.endDate subscriptionPlan.price subscriptionPlan.currency subscriptionPlan.razorpayPaymentId'
  );
  assert.equal(dbAfter1.subscriptionPlan.currency, 'INR');
  assert.equal(dbAfter1.subscriptionPlan.razorpayPaymentId, paymentId);

  assert.equal(
    await Payment.countDocuments({ orderId, gateway: 'razorpay', status: 'success' }),
    1
  );

  // Idempotency: verify-payment twice must not rewrite the subscription window.
  const verifyRes2 = await fetch(
    `${server.baseUrl}/api/payments/verify-payment?${authQuery}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(verifyPayload),
    }
  );
  assert.equal(verifyRes2.status, 200);

  const dbAfter2 = await User.findById(user._id).select(
    'subscriptionPlan.endDate subscriptionPlan.price subscriptionPlan.currency subscriptionPlan.razorpayPaymentId'
  );
  assert.equal(
    dbAfter2.subscriptionPlan.endDate?.toISOString(),
    dbAfter1.subscriptionPlan.endDate?.toISOString()
  );
  assert.equal(dbAfter2.subscriptionPlan.price, dbAfter1.subscriptionPlan.price);
  assert.equal(
    await Payment.countDocuments({ orderId, gateway: 'razorpay', status: 'success' }),
    1
  );

  // Duplicate webhook: must not extend subscription again.
  const webhookBodyObj = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: { id: paymentId, order_id: orderId, amount: order.amount, currency: order.currency },
      },
    },
  };
  const webhookBody = JSON.stringify(webhookBodyObj);
  const webhookSignature = hmacHex(process.env.RAZORPAY_WEBHOOK_SECRET, webhookBody);

  const webhookRes1 = await fetch(`${server.baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': webhookSignature },
    body: webhookBody,
  });
  assert.equal(webhookRes1.status, 200);

  const endAfterWebhook1 = (
    await User.findById(user._id).select('subscriptionPlan.endDate')
  ).subscriptionPlan.endDate;

  const webhookRes2 = await fetch(`${server.baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': webhookSignature },
    body: webhookBody,
  });
  assert.equal(webhookRes2.status, 200);

  const endAfterWebhook2 = (
    await User.findById(user._id).select('subscriptionPlan.endDate')
  ).subscriptionPlan.endDate;
  assert.equal(endAfterWebhook2?.toISOString(), endAfterWebhook1?.toISOString());
});

test('payments: verify-payment detects forwarded currency mismatch', async () => {
  await resetDb();
  const { user, token } = await seedPlanAndUser();
  const authQuery = `test_token=${encodeURIComponent(token)}`;

  const orderRes = await fetch(
    `${server.baseUrl}/api/payments/create-order?${authQuery}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan: 'pro', billingPeriod: 'month', currency: 'INR' }),
    }
  );
  assert.equal(orderRes.status, 200);
  const order = await orderRes.json();

  const orderId = order.id;
  const paymentId = `pay_mock_for_${orderId}`;
  const verifySignature = hmacHex(
    process.env.RAZORPAY_KEY_SECRET,
    `${orderId}|${paymentId}`
  );

  const verifyRes = await fetch(
    `${server.baseUrl}/api/payments/verify-payment?${authQuery}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: verifySignature,
        plan: 'pro',
        billingPeriod: 'month',
        amountMinor: order.amount,
        currency: 'EUR', // forwarded wrong currency should be rejected
      }),
    }
  );

  assert.equal(verifyRes.status, 400);
  const verifyData = await verifyRes.json();
  assert.match(String(verifyData?.error || ''), /currency mismatch/i);

  const dbUser = await User.findById(user._id).select('subscription');
  assert.equal(dbUser.subscription, 'free');
});

test('ai: predict/outcome/metrics works with python down fallback (internal_ensemble)', async () => {
  await resetDb();
  const { user, token } = await seedPlanAndUser();
  const authQuery = `test_token=${encodeURIComponent(token)}`;

  // Predict 7 times, label 5 of them.
  const predictionIds = [];
  for (let i = 0; i < 7; i++) {
    const predictRes = await fetch(
      `${server.baseUrl}/api/ai/predict?${authQuery}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          videoId: `vid_${i}`,
          platform: 'youtube',
          title: `T${i}`,
          engagement: { views: 1000 + i * 10, likes: 100 + i, comments: 10 + i },
        }),
      }
    );
    assert.equal(predictRes.status, 200);
    const prediction = await predictRes.json();
    predictionIds.push(prediction.id);
  }

  const p0 = await ViralPrediction.findById(predictionIds[0]).select('sourceProvider');
  assert.equal(p0.sourceProvider, 'internal_ensemble');

  for (let i = 0; i < 5; i++) {
    const outRes = await fetch(`${server.baseUrl}/api/ai/outcome?${authQuery}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        predictionId: predictionIds[i],
        views: 2000 + i * 10,
        likes: 200 + i,
        comments: 20 + i,
      }),
    });
    assert.equal(outRes.status, 200);
  }

  const metricsRes = await fetch(
    `${server.baseUrl}/api/ai/metrics?limit=50&scope=mine&${authQuery}`,
    {
      method: 'GET',
    }
  );
  assert.equal(metricsRes.status, 200);
  const metrics = await metricsRes.json();
  assert.equal(metrics.success, true);
  assert.equal(metrics.labeledForMetrics, 5);
  assert.equal(metrics.insufficientGroundTruth, false);
  assert.equal(typeof metrics.mae, 'number');
  assert.equal(typeof metrics.rmse, 'number');
});

