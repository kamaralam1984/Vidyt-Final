const test = require('node:test');
const assert = require('node:assert/strict');

require('ts-node/register/transpile-only');

const { parseFeaturesFromBody } = require('../../services/ml/featureUtils.ts');

test('parseFeaturesFromBody uses defaults when fields are missing', () => {
  const f = parseFeaturesFromBody({});
  assert.equal(f.hookScore, 50);
  assert.equal(f.thumbnailScore, 50);
  assert.equal(f.titleScore, 50);
  assert.equal(f.trendingScore, 50);
  assert.equal(f.videoDuration, 60);
  assert.equal(f.engagementRate, 5);
  assert.equal(f.growthVelocity, 100);
  assert.equal(f.commentVelocity, 10);
  assert.equal(f.likeRatio, 0.05);
  assert.equal(f.uploadTimingScore, 12);
});

test('parseFeaturesFromBody parses numbers from strings', () => {
  const f = parseFeaturesFromBody({
    hookScore: '80',
    thumbnailScore: '70.5',
    titleScore: 61,
    trendingScore: 'not-a-number',
    engagementRate: '12',
    likeRatio: '0.2',
    uploadTimingScore: '18',
  });

  assert.equal(f.hookScore, 80);
  assert.equal(f.thumbnailScore, 70.5);
  assert.equal(f.titleScore, 61);
  // trendingScore falls back to default if parseFloat(v) is NaN
  assert.equal(f.trendingScore, 50);
  assert.equal(f.engagementRate, 12);
  assert.equal(f.likeRatio, 0.2);
  assert.equal(f.uploadTimingScore, 18);
});

