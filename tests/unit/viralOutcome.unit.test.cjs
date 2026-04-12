const test = require('node:test');
const assert = require('node:assert/strict');

require('ts-node/register/transpile-only');

const {
  viralScoreFromEngagement,
  binaryClassifierLabelFromScore,
  extractYoutubeVideoId,
} = require('../../lib/viralOutcome.ts');

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

test('binaryClassifierLabelFromScore uses boundary at >= 50', () => {
  assert.equal(binaryClassifierLabelFromScore(49.99), 0);
  assert.equal(binaryClassifierLabelFromScore(50), 1);
  assert.equal(binaryClassifierLabelFromScore(100), 1);
});

test('extractYoutubeVideoId extracts id from common URL formats', () => {
  const id = 'dQw4w9WgXcQ';

  // Direct id
  assert.equal(extractYoutubeVideoId(id), id);

  // youtu.be/<id>
  assert.equal(extractYoutubeVideoId(`https://youtu.be/${id}`), id);

  // youtube.com/watch?v=<id>
  assert.equal(
    extractYoutubeVideoId(`https://www.youtube.com/watch?v=${id}`),
    id
  );

  // Invalid (length not 11)
  assert.equal(extractYoutubeVideoId('not-a-video-xx'), null);
});

