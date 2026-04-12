import { HookAnalysis } from './hookAnalyzer';
import { ThumbnailAnalysis } from './thumbnailAnalyzer';
import { TitleAnalysis } from './titleOptimizer';

export interface ViralPrediction {
  viralProbability: number;
  confidenceLevel: number;
}

export function predictViralPotential(
  hookAnalysis: HookAnalysis,
  thumbnailAnalysis: ThumbnailAnalysis,
  titleAnalysis: TitleAnalysis,
  trendingScore: number = 50,
  videoLength: number = 60
): ViralPrediction {
  // Weighted scoring system
  const hookWeight = 0.25;
  const thumbnailWeight = 0.25;
  const titleWeight = 0.20;
  const trendingWeight = 0.15;
  const lengthWeight = 0.15;
  
  // Calculate length score (optimal: 60-180 seconds)
  const lengthScore = calculateLengthScore(videoLength);
  
  // Calculate weighted viral probability
  const viralProbability = 
    (hookAnalysis.score * hookWeight) +
    (thumbnailAnalysis.score * thumbnailWeight) +
    (titleAnalysis.score * titleWeight) +
    (trendingScore * trendingWeight) +
    (lengthScore * lengthWeight);
  
  // Calculate confidence based on data completeness
  const confidenceLevel = calculateConfidence({
    hookScore: hookAnalysis.score,
    thumbnailScore: thumbnailAnalysis.score,
    titleScore: titleAnalysis.score,
    trendingScore,
  });

  return {
    viralProbability: Math.min(100, Math.round(viralProbability)),
    confidenceLevel: Math.min(100, Math.round(confidenceLevel)),
  };
}

function calculateLengthScore(length: number): number {
  // Optimal video length: 60-180 seconds (1-3 minutes)
  if (length >= 60 && length <= 180) {
    return 100;
  } else if (length < 60) {
    // Too short
    return (length / 60) * 80;
  } else if (length <= 300) {
    // 3-5 minutes: still good
    return 100 - ((length - 180) / 120) * 20;
  } else {
    // Too long
    return Math.max(30, 80 - ((length - 300) / 60) * 10);
  }
}

function calculateConfidence(scores: {
  hookScore: number;
  thumbnailScore: number;
  titleScore: number;
  trendingScore: number;
}): number {
  // Higher confidence when scores are consistent
  const avg = (scores.hookScore + scores.thumbnailScore + scores.titleScore + scores.trendingScore) / 4;
  const variance = [
    Math.abs(scores.hookScore - avg),
    Math.abs(scores.thumbnailScore - avg),
    Math.abs(scores.titleScore - avg),
    Math.abs(scores.trendingScore - avg),
  ].reduce((a, b) => a + b, 0) / 4;
  
  // Lower variance = higher confidence
  const confidence = Math.max(60, 100 - variance);
  
  return confidence;
}
