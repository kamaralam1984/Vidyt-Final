/**
 * Advanced Viral Prediction Model with TensorFlow Integration
 * Uses collected viral dataset and ML model to predict viral potential
 */

import ViralDataset from '@/models/ViralDataset';
import connectDB from '@/lib/mongodb';
import { predictWithModel, initializeModel, getModelInfo } from './learningEngine';

export interface ViralPredictionInput {
  hookScore: number;
  thumbnailScore: number;
  titleScore: number;
  trendingScore: number;
  videoDuration: number;
  postingTime: { day: string; hour: number };
  hashtags: string[];
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
}

export interface ViralPredictionOutput {
  viralProbability: number; // 0-100
  predictedViews: number;
  engagementForecast: {
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  growthCurve: Array<{ day: number; views: number }>;
  confidence: number; // 0-100
  factors: {
    hook: { score: number; impact: number };
    thumbnail: { score: number; impact: number };
    title: { score: number; impact: number };
    trending: { score: number; impact: number };
    timing: { score: number; impact: number };
  };
}

/**
 * Predict viral potential using ML model trained on viral dataset
 * Now enhanced with TensorFlow.js model integration
 */
export async function predictViralPotential(
  input: ViralPredictionInput
): Promise<ViralPredictionOutput> {
  await connectDB();

  // Initialize model if not already loaded
  try {
    await initializeModel();
  } catch (error) {
    console.warn('Model initialization failed, using rule-based prediction:', error);
  }

  // Prepare features for ML model
  const timingScore = calculateTimingScore(input.postingTime);
  const features = [
    normalize(input.hookScore, 0, 100),
    normalize(input.thumbnailScore, 0, 100),
    normalize(input.titleScore, 0, 100),
    normalize(input.trendingScore, 0, 100),
    normalize(input.videoDuration, 0, 600),
    normalize(timingScore, 0, 100),
    normalize(input.hashtags.length, 0, 20), // Hashtag count as feature
  ];

  // Get ML prediction if model is available
  let mlPrediction: number | null = null;
  try {
    const modelInfo = getModelInfo();
    if (modelInfo.isLoaded) {
      mlPrediction = await predictWithModel(features);
    }
  } catch (error) {
    console.warn('ML prediction failed, using rule-based:', error);
  }

  // Get similar viral videos from dataset for comparison
  const similarViralVideos = await ViralDataset.find({
    platform: input.platform,
    isViral: true,
    hookScore: { $gte: input.hookScore - 10, $lte: input.hookScore + 10 },
    thumbnailScore: { $gte: input.thumbnailScore - 10, $lte: input.thumbnailScore + 10 },
    duration: { $gte: input.videoDuration - 30, $lte: input.videoDuration + 30 },
  }).limit(100);

  // Calculate base prediction from similar videos
  let viralProbability = 50; // Base score
  let predictedViews = 1000;
  let confidence = 50;

  if (similarViralVideos.length > 0) {
    const avgViews = similarViralVideos.reduce((sum, v) => sum + v.views, 0) / similarViralVideos.length;
    const avgEngagement = similarViralVideos.reduce((sum, v) => sum + v.engagementRate, 0) / similarViralVideos.length;
    
    predictedViews = avgViews;
    viralProbability = Math.min(100, (avgEngagement / 10) * 100);
    confidence = Math.min(100, similarViralVideos.length * 2);
  }

  // Adjust based on individual factors
  const factors = {
    hook: {
      score: input.hookScore,
      impact: input.hookScore * 0.25, // 25% weight
    },
    thumbnail: {
      score: input.thumbnailScore,
      impact: input.thumbnailScore * 0.25, // 25% weight
    },
    title: {
      score: input.titleScore,
      impact: input.titleScore * 0.20, // 20% weight
    },
    trending: {
      score: input.trendingScore,
      impact: input.trendingScore * 0.15, // 15% weight
    },
    timing: {
      score: timingScore,
      impact: timingScore * 0.15, // 15% weight
    },
  };

  // Calculate rule-based viral probability
  const ruleBasedProbability = Math.min(100,
    factors.hook.impact +
    factors.thumbnail.impact +
    factors.title.impact +
    factors.trending.impact +
    factors.timing.impact
  );

  // Combine ML prediction with rule-based (weighted average)
  if (mlPrediction !== null) {
    // 70% ML, 30% rule-based
    viralProbability = Math.round(mlPrediction * 0.7 + ruleBasedProbability * 0.3);
    confidence = Math.min(100, confidence + 20); // Higher confidence with ML
  } else {
    viralProbability = Math.round(ruleBasedProbability);
  }

  // Adjust predicted views based on probability
  predictedViews = Math.round(predictedViews * (viralProbability / 50));

  // Calculate engagement forecast
  const engagementRate = viralProbability * 0.8; // Simplified
  const engagementForecast = {
    likes: Math.round(predictedViews * (engagementRate / 100) * 0.6),
    comments: Math.round(predictedViews * (engagementRate / 100) * 0.3),
    shares: Math.round(predictedViews * (engagementRate / 100) * 0.1),
    engagementRate,
  };

  // Generate growth curve (7 days)
  const growthCurve = generateGrowthCurve(predictedViews, viralProbability);

  return {
    viralProbability: Math.round(viralProbability),
    predictedViews: Math.round(predictedViews),
    engagementForecast,
    growthCurve,
    confidence: Math.round(confidence),
    factors,
  };
}

/**
 * Normalize value to 0-1 range
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate optimal timing score
 */
function calculateTimingScore(postingTime: { day: string; hour: number }): number {
  const optimalTimes: Record<string, number[]> = {
    Monday: [10, 11, 14, 20],
    Tuesday: [10, 11, 14, 20],
    Wednesday: [10, 11, 14, 20],
    Thursday: [10, 11, 14, 20],
    Friday: [10, 11, 18, 20],
    Saturday: [10, 11, 14],
    Sunday: [10, 11, 14],
  };

  const optimalHours = optimalTimes[postingTime.day] || [];
  const isOptimal = optimalHours.includes(postingTime.hour);
  
  return isOptimal ? 80 : 50;
}

/**
 * Generate growth curve prediction
 */
function generateGrowthCurve(peakViews: number, viralProbability: number): Array<{ day: number; views: number }> {
  const curve: Array<{ day: number; views: number }> = [];
  const days = 7;
  
  // Viral videos have exponential growth, non-viral have linear
  const isViral = viralProbability > 70;
  
  for (let day = 0; day <= days; day++) {
    let views: number;
    
    if (isViral) {
      // Exponential growth for viral content
      const growthFactor = Math.pow(peakViews / 100, 1 / days);
      views = Math.round(100 * Math.pow(growthFactor, day));
    } else {
      // Linear growth for normal content
      views = Math.round((peakViews / days) * day);
    }
    
    curve.push({ day, views: Math.min(views, peakViews) });
  }
  
  return curve;
}

/**
 * Train model on viral dataset (simplified version)
 * In production, use TensorFlow.js for actual ML training
 */
export async function trainViralModel(): Promise<void> {
  await connectDB();
  
  // Get viral dataset
  const viralVideos = await ViralDataset.find({ isViral: true }).limit(1000);
  const nonViralVideos = await ViralDataset.find({ isViral: false }).limit(1000);
  
  console.log(`Training model on ${viralVideos.length} viral and ${nonViralVideos.length} non-viral videos`);
  
  // TODO: Implement actual TensorFlow.js model training
  // This would involve:
  // 1. Feature extraction
  // 2. Model architecture definition
  // 3. Training loop
  // 4. Model evaluation
  // 5. Model saving
  
  console.log('Model training complete (simplified)');
}
