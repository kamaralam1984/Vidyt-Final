export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';
import Video from '@/models/Video';
import ViralPrediction from '@/models/ViralPrediction';
import AIModelVersion from '@/models/AIModelVersion';
import { loadModel, predictViralProbability } from '@/services/ml/viralModel';
import { ruleBasedScore, historicalScore, ensembleViralScore } from '@/services/ml/ensemble';
import { parseFeaturesFromBody, type ViralFeatures } from '@/services/ml/featureUtils';
import { predictWithPythonService } from '@/services/ai/viralPredictionService';
import { getClientIP, rateLimit } from '@/lib/rateLimiter';
import { enqueueAiJob } from '@/lib/queue';
import { extractYoutubeVideoId } from '@/lib/viralOutcome';

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

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const ip = getClientIP(request);
    const limiter = rateLimit(`ai-predict:${authUser.id}:${ip}`, 40, 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please retry in a minute.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const features = parseFeaturesFromBody(body);
    const hashtags = Array.isArray(body.hashtags) ? body.hashtags.filter((h: unknown) => typeof h === 'string') : [];
    const engagement = {
      views: Number(body?.engagement?.views || body.views || 0),
      likes: Number(body?.engagement?.likes || body.likes || 0),
      comments: Number(body?.engagement?.comments || body.comments || 0),
    };

    const rawVideoId = body.videoId || body.video_id;
    const platformStr = String(body.platform || 'youtube').toLowerCase();
    const videoId =
      typeof rawVideoId === 'string' && rawVideoId.trim()
        ? extractYoutubeVideoId(rawVideoId) || rawVideoId.trim()
        : platformStr.includes('youtube') && typeof body.videoUrl === 'string'
          ? extractYoutubeVideoId(body.videoUrl)
          : null;

    let nnScore = 50;
    let modelVersion = 'none';
    const modelVersionDoc = await AIModelVersion.findOne({ status: 'ready', isActive: true })
      .sort({ createdAt: -1 })
      .lean() as { version: string } | null;
    if (modelVersionDoc) {
      const model = await loadModel(modelVersionDoc.version);
      if (model) {
        nnScore = await predictViralProbability(model, features);
        modelVersion = modelVersionDoc.version;
      }
    }

    const ruleScore = ruleBasedScore(features);
    let historicalScoreValue = 50;
    const userVideos = await Video.find({ userId: authUser.id }).select('_id').lean();
    const videoIds = userVideos.map((v) => v._id);
    if (videoIds.length > 0) {
      const analyses = await Analysis.find({ videoId: { $in: videoIds } })
        .select('viralProbability')
        .lean();
      if (analyses.length > 0) {
        const avg =
          analyses.reduce((s, a) => s + (a.viralProbability ?? 0), 0) / analyses.length;
        historicalScoreValue = Math.min(100, Math.max(0, avg));
      }
    }
    const histScore = historicalScore(historicalScoreValue);
    let { viralProbability, confidence } = ensembleViralScore(nnScore, ruleScore, histScore);
    let insights = generatePredictionInsights(features, viralProbability);
    let modelProvider: 'internal_ensemble' | 'python_ml' = 'internal_ensemble';
    let servedModelVersion = modelVersion;

    // Prefer external Python ML model when available.
    const aiPrediction = await predictWithPythonService({
      title: String(body.title || ''),
      description: String(body.description || ''),
      hashtags,
      duration: Number(body.duration || features.videoDuration || 0),
      platform: String(body.platform || 'youtube'),
      category: String(body.category || 'general'),
      engagement,
      thumbnail_score: Number(body.thumbnail_score || features.thumbnailScore || 50),
      hook_score: Number(body.hook_score || features.hookScore || 50),
      title_score: Number(body.title_score || features.titleScore || 50),
      trending_score: Number(body.trending_score || features.trendingScore || 50),
    });
    if (aiPrediction) {
      viralProbability = Math.max(0, Math.min(100, Number(aiPrediction.viral_probability || 0)));
      confidence = Math.max(0, Math.min(100, Number(aiPrediction.confidence || 0)));
      insights = Array.isArray(aiPrediction.suggestions) && aiPrediction.suggestions.length > 0
        ? aiPrediction.suggestions.slice(0, 5)
        : insights;
      servedModelVersion = aiPrediction.model_version || servedModelVersion;
      modelProvider = 'python_ml';
    }

    const doc = await ViralPrediction.create({
      userId: authUser.id,
      videoId: videoId || undefined,
      features,
      nnScore,
      ruleScore,
      historicalScore: histScore,
      viralProbability,
      confidence,
      insights,
      modelVersion: servedModelVersion,
      sourceProvider: modelProvider,
      title: String(body.title || ''),
      description: String(body.description || ''),
      hashtags,
      platform: String(body.platform || 'youtube'),
      category: String(body.category || 'general'),
      engagement,
    });

    // Non-blocking queue log for async pipelines/analytics.
    if (process.env.AI_PREDICTION_QUEUE_ENABLED === 'true') {
      enqueueAiJob({
        jobType: 'prediction',
        userId: String(authUser.id),
        data: {
          predictionId: String(doc._id),
          provider: modelProvider,
          modelVersion: servedModelVersion,
          viralProbability,
          confidence,
        },
        opts: { priority: 5 },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      viralProbability: Math.round(viralProbability * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      insights,
      breakdown: {
        neuralNetwork: Math.round(nnScore * 100) / 100,
        ruleBased: Math.round(ruleScore * 100) / 100,
        historical: Math.round(histScore * 100) / 100,
      },
      modelVersion: servedModelVersion,
      provider: modelProvider,
      id: doc._id.toString(),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Prediction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
