import test from 'node:test';
import assert from 'node:assert/strict';

test('MAE and RMSE helper sanity', () => {
  const predicted = [80, 50, 20];
  const actual = [70, 50, 40];
  const errors = predicted.map((p, i) => p - actual[i]);
  const mae = errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length;
  const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
  assert.equal(Number(mae.toFixed(2)), 10);
  assert.equal(Number(rmse.toFixed(2)), 12.91);
});

test('viralScoreFromEngagement stays within 0-100', () => {
  function viralScoreFromEngagement(views, likes, comments) {
    const v = Math.max(0, Number(views) || 0);
    const lk = Math.max(0, Number(likes) || 0);
    const cm = Math.max(0, Number(comments) || 0);
    const er = v > 0 ? ((lk + cm) / v) * 100 : 0;
    const viewsScore = Math.min(100, (v / 10000) * 100);
    const engagementScore = Math.min(100, er * 10);
    return Math.max(0, Math.min(100, viewsScore * 0.7 + engagementScore * 0.3));
  }
  assert.equal(viralScoreFromEngagement(0, 0, 0), 0);
  assert.ok(viralScoreFromEngagement(10000, 1000, 100) > 0);
  assert.ok(viralScoreFromEngagement(1e9, 1e6, 1e6) <= 100);
});

test('confidence bucket boundaries are deterministic', () => {
  const bucket = (v) => {
    if (v < 0.25) return '0-0.25';
    if (v < 0.5) return '0.25-0.5';
    if (v < 0.75) return '0.5-0.75';
    return '0.75-1.0';
  };
  assert.equal(bucket(0.1), '0-0.25');
  assert.equal(bucket(0.3), '0.25-0.5');
  assert.equal(bucket(0.6), '0.5-0.75');
  assert.equal(bucket(0.9), '0.75-1.0');
});
