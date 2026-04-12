export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';

import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';
import Video from '@/models/Video';
import ViralPrediction from '@/models/ViralPrediction';
import AIModelVersion from '@/models/AIModelVersion';
import { loadModel, predictViralProbability } from '@/services/ml/viralModel';
import { ruleBasedScore, historicalScore, ensembleViralScore } from '@/services/ml/ensemble';
import { parseFeaturesFromBody, type ViralFeatures } from '@/services/ml/featureUtils';
import { predictWithPythonService } from '@/services/ai/viralPredictionService';
import { rateLimit } from '@/lib/rateLimiter';
import { enqueueAiJob } from '@/lib/queue';
import { extractYoutubeVideoId } from '@/lib/viralOutcome';
import { withAnalysisRateLimit } from '@/middleware/rateLimitMiddleware';

function generatePredictionInsights(features: ViralFeatures, viralProbability: number): string[] {
  const insights: string[] = [];
  if (features.hookScore >= 70) insights.push('Strong hook score—good for retention.');
  else if (features.hookScore < 40) insights.push('Consider improving your hook in the first 3 seconds.');
  if (features.thumbnailScore >= 70) insights.push('Thumbnail score is strong—helps CTR.');
  else if (features.thumbnailScore < 40) insights.push('Try A/B testing thumbnails with faces or contrast.');
  if (features.videoDuration <= 60) insights.push('Short videos under 60 seconds tend to get higher engagement.');
  if (features.uploadTimingScore >= 18 || features.uploadTimingScore <= 9)
    insights.push('Peak posting hours (7PM–9AM) often perform better.');
  if (viralProbability >= 70) insights.push('High viral potential—consider boosting with ads or community.');
  if (viralProbability < 40) insights.push('Focus on title and trending score to improve reach.');
  return insights.slice(0, 5);
}

import { predictViralPotential } from '@/services/ai/viralPredictor';

async function handlePredict(request: NextRequest) {
  try {
    const access = await requireAIToolAccess(request, 'advancedAiViralPrediction');
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const authUser = { id: access.userId, role: access.role };

    await connectDB();
    
    // Additional per-user rate limiting (60 req/hour for production analysis)
    const limiter = rateLimit(`ai-predict:${authUser.id}`, { limit: 60, windowMs: 60 * 60 * 1000 });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Analysis limit reached. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': String(limiter.retryAfter || 60) }
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    
    // Use the upgraded Hardcore Production service
    const prediction = await predictViralPotential({
        ...body,
        platform: body.platform || 'youtube'
    });

    // Persistent Storage of the prediction
    const doc = await ViralPrediction.create({
      userId: authUser.id,
      videoId: body.videoId || undefined,
      features: body, // Store raw features for audit
      viralProbability: prediction.score,
      confidence: prediction.confidence * 100,
      reasons: prediction.reasons,
      weak_points: prediction.weak_points,
      improvements: prediction.improvements,
      insights: prediction.reasons, // Legacy support
      modelVersion: 'hardcore_v1',
      sourceProvider: 'internal_ensemble',
      title: String(body.title || ''),
      platform: String(body.platform || 'youtube'),
      engagement: body.engagement || {},
    });

    return NextResponse.json({
      success: true,
      ...prediction,
      id: doc._id.toString(),
      modelVersion: 'hardcore_v1'
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Prediction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { withUsageLimit } from '@/middleware/usageGuard';

// Wrap with analysis rate limiting (60 req/hour) AND plan-based usage limits
export const POST = withAnalysisRateLimit(
  withUsageLimit((req) => handlePredict(req), 'video_analysis'),
  { endpoint: '/api/ai/predict' }
);
