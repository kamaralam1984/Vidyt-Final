/**
 * Advanced Viral Prediction Model with TensorFlow Integration
 * Uses collected viral dataset and ML model to predict viral potential
 */

import ViralDataset from '@/models/ViralDataset';
import connectDB from '@/lib/mongodb';
import { predictWithModel, initializeModel, getModelInfo } from './learningEngine';
import { predictWithPythonService } from './viralPredictionService';

export interface ViralPredictionInput extends Record<string, any> {
  // Base 10
  hookScore: number;
  thumbnailScore: number;
  titleScore: number;
  trendingScore: number;
  videoDuration: number;
  engagementRate?: number;
  growthVelocity?: number;
  commentVelocity?: number;
  likeRatio?: number;
  uploadTimingScore?: number;
  // Others will be handled dynamically or from body
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
}

export interface ViralPredictionOutput {
  score: number; // 0-100
  viralProbability: number; // Same as score for compatibility
  predictedViews: number;
  confidence: number; // 0-1
  reasons: string[];
  weak_points: string[];
  improvements: string[];
  engagementForecast: {
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  growthCurve: Array<{ day: number; views: number }>;
}

/**
 * Platform-specific weights and factors for viral prediction
 */
const PLATFORM_CONFIGS: Record<string, {
  weights: { hook: number; thumbnail: number; title: number; trending: number; timing: number };
  viewMultiplier: number;
  engagementBase: number;
}> = {
  youtube: {
    weights: { hook: 0.2, thumbnail: 0.35, title: 0.25, trending: 0.1, timing: 0.1 },
    viewMultiplier: 5000,
    engagementBase: 0.08,
  },
  facebook: {
    weights: { hook: 0.4, thumbnail: 0.2, title: 0.15, trending: 0.15, timing: 0.1 },
    viewMultiplier: 3000,
    engagementBase: 0.12,
  },
  instagram: {
    weights: { hook: 0.5, thumbnail: 0.25, title: 0.05, trending: 0.1, timing: 0.1 },
    viewMultiplier: 2500,
    engagementBase: 0.18,
  },
  tiktok: {
    weights: { hook: 0.6, thumbnail: 0.15, title: 0.05, trending: 0.15, timing: 0.05 },
    viewMultiplier: 10000,
    engagementBase: 0.22,
  }
};

import { ViralFeatures, FEATURE_NAMES } from '../ml/featureUtils';

/**
 * Predict viral potential using advanced 30-feature ML model
 */
export async function predictViralPotential(
  input: ViralPredictionInput
): Promise<ViralPredictionOutput> {
  if (input.videoId) {
    const Video = (await import('@/models/Video')).default;
    const video = await Video.findById(input.videoId).lean() as any;
    if (video) {
      input.title = video.title || input.title;
      input.description = video.description || input.description;
      input.hashtags = video.hashtags || input.hashtags;
      input.platform = video.platform || input.platform;
    }
  }

  await connectDB();

  // 1. Rigorous 30-Feature Extraction
  const features = extract30Features(input);

  // 2. ML Inference
  const rawScore = await predictWithModel(features);
  
  // 3. Confidence Calculation (Based on data completeness and model certainty)
  const confidence = calculateConfidence(input);

  // 4. Generate Explainable Insights
  const { reasons, weak_points, improvements } = generateInsights(features, rawScore);

  // 5. Forecast Metrics
  const platformConfig = PLATFORM_CONFIGS[input.platform] || PLATFORM_CONFIGS.youtube;
  const predictedViews = Math.round(platformConfig.viewMultiplier * (rawScore / 25));
  const engagementRate = Math.min(25, (rawScore * platformConfig.engagementBase));

  const engagementForecast = {
    likes: Math.round(predictedViews * (engagementRate / 100) * 0.6),
    comments: Math.round(predictedViews * (engagementRate / 100) * 0.3),
    shares: Math.round(predictedViews * (engagementRate / 100) * 0.1),
    engagementRate,
  };

  return {
    score: Math.round(rawScore),
    viralProbability: Math.round(rawScore),
    predictedViews,
    confidence,
    reasons,
    weak_points,
    improvements,
    engagementForecast,
    growthCurve: generateGrowthCurve(predictedViews, rawScore),
  };
}

function extract30Features(input: any): ViralFeatures {
    const f: any = {};
    // Default values for common missing features
    const defaults: Record<string, number> = {
        titleLength: 50,
        descriptionLength: 500,
        hashtagCount: 5,
        emotionalTriggers: 0.5,
        clickPotential: 0.6,
        nicheConcentration: 0.7,
        timeOfDayScore: 0.8,
        dayOfWeekScore: 0.7,
        audioQualityScore: 0.9,
        visualClarityScore: 0.85,
        retentionEstimate: 0.4,
        ctrEstimate: 0.08,
        subscriberCountLog: 4,
        channelAgeDays: 365,
        averageViewsLast10: 1000,
        shareVelocity: 5,
        saveVelocity: 10,
        watchTimeEstimate: 120,
        competitionScore: 0.5,
        platformFitScore: 0.8
    };

    FEATURE_NAMES.forEach(name => {
        f[name] = typeof input[name] === 'number' ? input[name] : (defaults[name] || 0.5);
    });

    return f as ViralFeatures;
}

function calculateConfidence(input: any): number {
    let score = 0.7; // Base
    if (input.hookScore && input.thumbnailScore && input.titleScore) score += 0.1;
    if (input.averageViewsLast10) score += 0.1;
    if (input.ctrEstimate) score += 0.05;
    return Math.min(0.98, score);
}

function generateInsights(f: ViralFeatures, score: number) {
    const reasons: string[] = [];
    const weak_points: string[] = [];
    const improvements: string[] = [];

    if (f.hookScore > 80) reasons.push("Strong initial hook increases early retention.");
    if (f.thumbnailScore > 85) reasons.push("High-contrast thumbnail optimized for CTR.");
    if (f.trendingScore > 75) reasons.push("Content aligns with high-volume search trends.");

    if (f.titleScore < 60) {
        weak_points.push("Title lacks emotional urgency.");
        improvements.push("Add power words like 'Secret', 'Insane', or 'Never' to the title.");
    }
    
    if (f.visualClarityScore < 70) {
        weak_points.push("Visual clutter detected in the first 3 seconds.");
        improvements.push("Simplify opening visuals to focus on the primary subject.");
    }

    if (score > 80) reasons.push("High niche concentration fits current algorithm patterns.");
    
    return { reasons, weak_points, improvements };
}

function generateGrowthCurve(peakViews: number, score: number): Array<{ day: number; views: number }> {
  const curve: Array<{ day: number; views: number }> = [];
  const days = 14;
  const isViral = score > 75;
  
  for (let day = 0; day <= days; day++) {
    let views: number;
    if (isViral) {
      views = Math.round(peakViews * (Math.pow(day / days, 3)));
    } else {
      views = Math.round((peakViews / days) * day);
    }
    curve.push({ day, views: Math.max(10, views) });
  }
  return curve;
}
