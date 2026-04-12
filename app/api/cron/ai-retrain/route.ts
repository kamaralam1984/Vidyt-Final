export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { enqueueAiJob } from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Avoid open cron endpoints in production if CRON_SECRET is missing.
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    const job = await enqueueAiJob({
      jobType: 'training',
      data: { triggeredBy: 'cron', minSamples: 100 },
      opts: { priority: 10 },
    });

    console.log('[cron:ai-retrain] enqueued training job', {
      jobId: String(job?.id || ''),
    });

    return NextResponse.json({
      success: true,
      message: 'AI retraining enqueued',
      jobId: String(job.id),
      stats: { total: 1, enqueued: 1, failures: 0 },
    });
  } catch (e: any) {
    console.error('[cron:ai-retrain] failed to enqueue', e);
    return NextResponse.json(
      { error: e?.message || 'Failed to enqueue retraining', stats: { total: 1, enqueued: 0, failures: 1 } },
      { status: 500 }
    );
  }
}
