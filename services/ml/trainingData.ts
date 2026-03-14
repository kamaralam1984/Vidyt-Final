/**
 * Build training samples from ViralDataset for the viral prediction model.
 */

import ViralDataset from '@/models/ViralDataset';
import connectDB from '@/lib/mongodb';
import type { ViralFeatures } from './featureUtils';
import type { TrainingSample } from './viralModel';

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
    };
    return {
      features,
      isViral: !!d.isViral,
    };
  });
}
