import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import { getSiteStats, isGscConfigured } from '@/lib/googleSearchConsole';
import { INDEXABLE_THRESHOLD } from '@/lib/qualityScorer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/super/seo-pages/stats
 *
 * Rolls up counts (today / 7d / 30d / total / indexable / pending / rejected)
 * and merges last-28d GSC site-wide aggregates. GSC portion gracefully
 * degrades to `{connected:false}` if credentials aren't set.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdminRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const start7d = new Date(now); start7d.setDate(now.getDate() - 7);
    const start30d = new Date(now); start30d.setDate(now.getDate() - 30);

    const [
      total,
      createdToday,
      created7d,
      created30d,
      indexable,
      pending,
      rejected,
      bySource,
      byCategory,
      avgQuality,
    ] = await Promise.all([
      SeoPage.countDocuments({}),
      SeoPage.countDocuments({ createdAt: { $gte: startOfToday } }),
      SeoPage.countDocuments({ createdAt: { $gte: start7d } }),
      SeoPage.countDocuments({ createdAt: { $gte: start30d } }),
      SeoPage.countDocuments({ isIndexable: true }),
      SeoPage.countDocuments({ isIndexable: { $ne: true }, qualityScore: { $gte: INDEXABLE_THRESHOLD } }),
      SeoPage.countDocuments({ isIndexable: { $ne: true }, qualityScore: { $lt: INDEXABLE_THRESHOLD } }),
      SeoPage.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SeoPage.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, indexed: { $sum: { $cond: [{ $eq: ['$isIndexable', true] }, 1, 0] } } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      SeoPage.aggregate([{ $group: { _id: null, avg: { $avg: '$qualityScore' } } }]),
    ]);

    // Growth per day (last 30 days) — for mini-chart
    const dailyCreation = await SeoPage.aggregate([
      { $match: { createdAt: { $gte: start30d } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          indexed: { $sum: { $cond: [{ $eq: ['$isIndexable', true] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // GSC aggregates — wrap defensively so a credential / network blow-up
    // never 500s the dashboard. The function already has its own try/catch
    // but we add a belt-and-braces guard here too.
    let gsc: any = {
      connected: false,
      totalClicks: 0,
      totalImpressions: 0,
      avgCtr: 0,
      avgPosition: 0,
      topQueries: [],
      topPages: [],
    };
    try {
      gsc = await getSiteStats(28);
    } catch (e: any) {
      console.error('[seo-pages/stats] getSiteStats failed:', e?.message || e);
      gsc.error = e?.message || 'GSC unavailable';
    }

    return NextResponse.json({
      success: true,
      counts: {
        total,
        createdToday,
        created7d,
        created30d,
        indexable,
        pending,
        rejected,
        avgQualityScore: Math.round(avgQuality?.[0]?.avg || 0),
      },
      bySource,
      byCategory,
      dailyCreation,
      gsc: {
        configured: isGscConfigured(),
        ...gsc,
      },
      threshold: INDEXABLE_THRESHOLD,
      timestamp: now.toISOString(),
    });
  } catch (e: any) {
    console.error('[seo-pages/stats] 500:', e?.stack || e?.message || e);
    return NextResponse.json(
      { error: e?.message || 'Internal error', detail: String(e?.stack || e).slice(0, 500) },
      { status: 500 }
    );
  }
}
