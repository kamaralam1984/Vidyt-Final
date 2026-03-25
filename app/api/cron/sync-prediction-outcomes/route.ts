export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { syncYoutubeOutcomesForPredictions } from '@/lib/predictionOutcomeSync';

/**
 * Background job: fill `outcome` on ViralPrediction rows using YouTube Data API.
 * Requires Authorization: Bearer CRON_SECRET (or open if CRON_SECRET unset — dev only).
 */
export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Number(body.batchSize || 25);
    const minAgeHours = Number(body.minAgeHours || 24);

    const result = await syncYoutubeOutcomesForPredictions({
      batchSize,
      minAgeHours,
      platform: 'youtube',
    });

    const failures = result.errors?.length || 0;
    console.log('[cron:sync-prediction-outcomes]', {
      scanned: result.scanned,
      updated: result.updated,
      skipped: result.skipped,
      failures,
    });

    return NextResponse.json({
      success: true,
      ...result,
      stats: {
        total: result.scanned,
        processed: result.updated,
        failures,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Sync failed';
    console.error('[cron:sync-prediction-outcomes] failed', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
