export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import ViralPrediction from '@/models/ViralPrediction';
import { getCacheJSON, setCacheJSON } from '@/lib/cache';
import { getClientIP, rateLimit } from '@/lib/rateLimiter';

function isSuperRole(role: string | undefined): boolean {
  const r = String(role || '').toLowerCase();
  return r === 'super-admin' || r === 'superadmin';
}

const MIN_LABELED_FOR_AGGREGATE = 5;

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ip = getClientIP(req);
    const limiter = rateLimit(`ai-metrics:${user.id}:${ip}`, 60, 60 * 1000);
    if (!limiter.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    await connectDB();
    const url = new URL(req.url);
    const limit = Math.max(50, Math.min(10000, Number(url.searchParams.get('limit') || 5000)));
    const superUser = isSuperRole(user.role);
    const scope = url.searchParams.get('scope') === 'global' && superUser ? 'global' : 'mine';

    const cacheKey = `ai:metrics:v2:${scope}:${user.id}:${limit}`;
    const cached = await getCacheJSON<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const baseFilter =
      scope === 'global'
        ? {}
        : { userId: user.id };

    const [totalPredictions, labeledPredictions] = await Promise.all([
      ViralPrediction.countDocuments(baseFilter),
      ViralPrediction.find({
        ...baseFilter,
        'outcome.viralScore0to100': { $exists: true, $ne: null },
      })
        .select('viralProbability confidence createdAt sourceProvider modelVersion outcome')
        .sort({ 'outcome.capturedAt': -1 })
        .limit(limit)
        .lean(),
    ]);

    const labeledCount = labeledPredictions.length;

    const insufficientGroundTruth = labeledCount < MIN_LABELED_FOR_AGGREGATE;

    let mae = 0;
    let rmse = 0;
    const trendMap = new Map<string, { sumAbs: number; sumSq: number; count: number }>();

    if (!insufficientGroundTruth) {
      let absErr = 0;
      let sqErr = 0;
      for (const d of labeledPredictions) {
        const predicted = Number(d.viralProbability || 0);
        const actual = Number(d.outcome?.viralScore0to100 ?? 0);
        const err = predicted - actual;
        absErr += Math.abs(err);
        sqErr += err * err;

        const day = new Date(d.outcome?.capturedAt || d.createdAt).toISOString().slice(0, 10);
        const g = trendMap.get(day) || { sumAbs: 0, sumSq: 0, count: 0 };
        g.sumAbs += Math.abs(err);
        g.sumSq += err * err;
        g.count += 1;
        trendMap.set(day, g);
      }
      const n = labeledCount;
      mae = absErr / n;
      rmse = Math.sqrt(sqErr / n);
    }

    const trend = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({
        date,
        count: v.count,
        mae: Number((v.sumAbs / v.count).toFixed(2)),
        rmse: Number(Math.sqrt(v.sumSq / v.count).toFixed(2)),
      }));

    const byOutcomeSource = labeledPredictions.reduce(
      (acc: Record<string, number>, d: any) => {
        const k = String(d.outcome?.source || 'unknown');
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      },
      {}
    );

    const byModel = labeledPredictions.reduce((acc: Record<string, number>, d: any) => {
      const k = String(d.modelVersion || 'unknown');
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const byProvider = labeledPredictions.reduce((acc: Record<string, number>, d: any) => {
      const k = String(d.sourceProvider || 'internal_ensemble');
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const payload = {
      success: true,
      metricsBasis: 'ground_truth_outcome_only' as const,
      definition:
        'MAE/RMSE compare viralProbability to outcome.viralScore0to100 (verified post-hoc). ' +
        'Predictions without outcome are excluded. Use POST /api/ai/outcome or cron sync to label.',
      scope,
      totalPredictions,
      labeledForMetrics: labeledCount,
      unlabeledApproximate: Math.max(0, totalPredictions - labeledCount),
      insufficientGroundTruth,
      minLabeledRequired: MIN_LABELED_FOR_AGGREGATE,
      mae: insufficientGroundTruth ? null : Number(mae.toFixed(2)),
      rmse: insufficientGroundTruth ? null : Number(rmse.toFixed(2)),
      trend,
      byModel,
      byProvider,
      byOutcomeSource,
    };
    await setCacheJSON(cacheKey, payload, 60);
    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch AI metrics' }, { status: 500 });
  }
}
