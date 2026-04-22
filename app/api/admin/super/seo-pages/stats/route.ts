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

  // GSC aggregates — graceful fallback
  const gsc = await getSiteStats(28);

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
}
