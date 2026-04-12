/**
 * Ensemble prediction: 40% NN + 30% rule-based + 30% historical pattern
 */

import type { ViralFeatures } from './featureUtils';

export function ruleBasedScore(features: ViralFeatures): number {
  const hook = Math.min(100, Math.max(0, features.hookScore));
  const thumb = Math.min(100, Math.max(0, features.thumbnailScore));
  const title = Math.min(100, Math.max(0, features.titleScore));
  const trend = Math.min(100, Math.max(0, features.trendingScore));
  const engagement = Math.min(100, features.engagementRate * 5);
  const score = (hook * 0.25 + thumb * 0.25 + title * 0.2 + trend * 0.15 + engagement * 0.15);
  return Math.min(100, score);
}

export function historicalScore(userAverageViral: number): number {
  return Math.min(100, Math.max(0, userAverageViral));
}

export function ensembleViralScore(
  nnScore: number,
  ruleScore: number,
  historicalScoreValue: number
): { viralProbability: number; confidence: number } {
  const viralProbability = nnScore * 0.4 + ruleScore * 0.3 + historicalScoreValue * 0.3;
  const variance = Math.abs(nnScore - ruleScore) + Math.abs(nnScore - historicalScoreValue) + Math.abs(ruleScore - historicalScoreValue);
  const confidence = Math.max(0, Math.min(100, 100 - variance / 2));
  return {
    viralProbability: Math.min(100, Math.max(0, viralProbability)),
    confidence: Math.round(confidence * 100) / 100,
  };
}
