const test = require('node:test');
const assert = require('node:assert/strict');

require('ts-node/register/transpile-only');

const { viralScoreFromEngagement } = require('../../lib/viralOutcome.ts');

test('viralScoreFromEngagement stays within 0..100', () => {
  assert.equal(viralScoreFromEngagement(0, 0, 0), 0);

  const s1 = viralScoreFromEngagement(10_000, 1_000, 100);
  assert.ok(s1 > 0);
  assert.ok(s1 <= 100);

  const s2 = viralScoreFromEngagement(1e9, 1e6, 1e6);
  assert.ok(s2 <= 100);
});

test('viralScoreFromEngagement monotonic-ish with likes', () => {
  const low = viralScoreFromEngagement(10_000, 100, 0);
  const high = viralScoreFromEngagement(10_000, 1_000, 0);
  assert.ok(high >= low);
});

