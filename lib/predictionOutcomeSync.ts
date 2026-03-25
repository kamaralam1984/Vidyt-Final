import connectDB from '@/lib/mongodb';
import ViralPrediction from '@/models/ViralPrediction';
import { fetchYouTubeVideoStats } from '@/services/youtubeVideoStats';
import { viralScoreFromEngagement } from '@/lib/viralOutcome';

export type SyncOutcomesResult = {
  scanned: number;
  updated: number;
  skipped: number;
  errors: string[];
};

/**
 * Attach ground truth via YouTube Data API for predictions that have videoId, no outcome yet.
 */
export async function syncYoutubeOutcomesForPredictions(options: {
  batchSize?: number;
  minAgeHours?: number;
  platform?: string;
}): Promise<SyncOutcomesResult> {
  const batchSize = Math.max(1, Math.min(50, options.batchSize ?? 25));
  const minAgeHours = Math.max(0, options.minAgeHours ?? 24);
  const platform = (options.platform || 'youtube').toLowerCase();

  await connectDB();
  const cutoff = new Date(Date.now() - minAgeHours * 60 * 60 * 1000);

  const docs = await ViralPrediction.find({
    platform: new RegExp(`^${platform}`, 'i'),
    videoId: { $exists: true, $nin: [null, ''] },
    outcome: { $exists: false },
    createdAt: { $lte: cutoff },
  })
    .select('_id videoId')
    .limit(batchSize)
    .lean();

  const result: SyncOutcomesResult = {
    scanned: docs.length,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const d of docs) {
    const vid = String(d.videoId || '').trim();
    if (!vid) {
      result.skipped += 1;
      continue;
    }
    try {
      const stats = await fetchYouTubeVideoStats(vid);
      if (!stats) {
        result.skipped += 1;
        continue;
      }
      const viralScore0to100 = viralScoreFromEngagement(stats.views, stats.likes, stats.comments);
      await ViralPrediction.updateOne(
        { _id: d._id, outcome: { $exists: false } },
        {
          $set: {
            outcome: {
              viralScore0to100,
              views: stats.views,
              likes: stats.likes,
              comments: stats.comments,
              capturedAt: new Date(),
              source: 'youtube_api',
            },
          },
        }
      );
      result.updated += 1;
    } catch (e: unknown) {
      result.errors.push(`${vid}: ${e instanceof Error ? e.message : 'error'}`);
    }
  }

  return result;
}
