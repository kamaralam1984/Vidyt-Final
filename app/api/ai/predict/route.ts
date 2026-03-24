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

    const body = await request.json().catch(() => ({}));
    const features = parseFeaturesFromBody(body);

    let nnScore = 50;
    let modelVersion = 'none';
    const modelVersionDoc = await AIModelVersion.findOne({ status: 'ready' }).sort({ createdAt: -1 }).lean() as { version: string } | null;
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
    const { viralProbability, confidence } = ensembleViralScore(nnScore, ruleScore, histScore);
    const insights = generatePredictionInsights(features, viralProbability);

    const doc = await ViralPrediction.create({
      userId: authUser.id,
      features,
      nnScore,
      ruleScore,
      historicalScore: histScore,
      viralProbability,
      confidence,
      insights,
      modelVersion,
    });

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
      id: doc._id.toString(),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Prediction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
