/**
 * Build training samples from ViralDataset for the viral prediction model.
 */

import ViralDataset from '@/models/ViralDataset';
import ViralPrediction from '@/models/ViralPrediction';
import connectDB from '@/lib/mongodb';
import type { ViralFeatures } from './featureUtils';
import type { TrainingSample } from './viralModel';
import type { ViralAiTrainSample } from '@/services/ai/viralPredictionService';
import { binaryClassifierLabelFromScore } from '@/lib/viralOutcome';

export async function getTrainingDataFromViralDataset(limit = 5000): Promise<TrainingSample[]> {
  await connectDB();

  const docs = await ViralDataset.find({})
    .lean()
    .limit(limit)
    .sort({ collectedAt: -1 });

  return docs.map((d) => {
    const views = d.views || 1;
    const hour = d.postedAt ? new Date(d.postedAt).getHours() : 12;
    const features: ViralFeatures = {
      hookScore: d.hookScore ?? 50,
      thumbnailScore: d.thumbnailScore ?? 50,
      titleScore: d.titleScore ?? 50,
      trendingScore: d.trendingScore ?? 50,
      videoDuration: Math.min(600, d.duration ?? 60),
      engagementRate: d.engagementRate ?? 0,
      growthVelocity: d.growthVelocity ?? 0,
      commentVelocity: Math.min(1000, d.comments ?? 0),
      likeRatio: Math.min(1, (d.likes ?? 0) / views),
      uploadTimingScore: hour,
      titleLength: 0,
      descriptionLength: 0,
      hashtagCount: 0,
      emotionalTriggers: 0,
      clickPotential: 0,
      nicheConcentration: 0,
      timeOfDayScore: hour,
      dayOfWeekScore: 0,
      audioQualityScore: 50,
      visualClarityScore: 50,
      retentionEstimate: 0,
      ctrEstimate: 0,
      subscriberCountLog: 0,
      channelAgeDays: 0,
      averageViewsLast10: 0,
      shareVelocity: 0,
      saveVelocity: 0,
      watchTimeEstimate: 0,
      competitionScore: 0,
      platformFitScore: 50,
    };
    return {
      features,
      isViral: !!d.isViral,
    };
  });
}

/**
 * Training rows with **verified** labels from `ViralPrediction.outcome` (user, YouTube API, admin, cron).
 * Feature snapshots use the prediction-time `engagement` + scores (not outcome stats) so labels are honest.
 */
export async function getLabeledPredictionTrainingSamples(limit = 3000): Promise<ViralAiTrainSample[]> {
  await connectDB();
  const docs = await ViralPrediction.find({
    'outcome.viralScore0to100': { $exists: true, $ne: null },
  })
    .sort({ 'outcome.capturedAt': -1 })
    .limit(limit)
    .lean();

  return docs.map((d: any) => {
    const f = d.features || {};
    const eng = d.engagement || {};
    const label = binaryClassifierLabelFromScore(Number(d.outcome?.viralScore0to100 ?? 0));
    return {
      title: String(d.title || ''),
      description: String(d.description || ''),
      hashtags: Array.isArray(d.hashtags) ? d.hashtags : [],
      duration: Number(f.videoDuration || 0),
      platform: String(d.platform || 'youtube'),
      category: String(d.category || 'general'),
      views: Number(eng.views || 0),
      likes: Number(eng.likes || 0),
      comments: Number(eng.comments || 0),
      thumbnail_score: Number(f.thumbnailScore ?? 50),
      hook_score: Number(f.hookScore ?? 50),
      title_score: Number(f.titleScore ?? 50),
      trending_score: Number(f.trendingScore ?? 50),
      viral_label: label,
    };
  });
}
