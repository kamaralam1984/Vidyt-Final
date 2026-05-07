export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';

/**
 * GET /api/cron/cleanup-low-quality — daily auto-cleanup of low-quality
 * non-indexable pages (rejected + pending).
 *
 * Owner spec:
 *   "reject aur pending file har din delete automatic hona chahiye"
 *
 * Behaviour:
 *   • Deletes every non-indexable page with qualityScore below the
 *     creation gate (MIN_KEEP_QUALITY = 70).
 *   • Preserves source='user_search' pages — those represent real user
 *     intent and should never be silently nuked even if low quality.
 *   • Preserves any page already in the sitemap (isIndexable:true).
 *   • Skips pages newer than 24h so a freshly-created page that hasn't
 *     been re-scored yet doesn't get deleted before it gets a fair shot.
 *   • Idempotent — safe to re-run within the same day.
 *
 * Schedule: once daily, after promote-seo-pages (02:00 UTC) so any page
 * eligible for promotion has already flipped to isIndexable:true before
 * cleanup looks at it. Recommended cron: 03:00 UTC.
 */

const MIN_KEEP_QUALITY = 70;
const SAFE_AGE_HOURS = 24;

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const cutoff = new Date(Date.now() - SAFE_AGE_HOURS * 3600_000);

    const filter = {
      isIndexable: { $ne: true },
      qualityScore: { $lt: MIN_KEEP_QUALITY },
      source: { $in: ['auto_daily', 'trending'] },
      createdAt: { $lt: cutoff },
    };

    const totalBefore = await SeoPage.countDocuments({});
    const matched = await SeoPage.countDocuments(filter);
    const r = await SeoPage.deleteMany(filter);
    const totalAfter = await SeoPage.countDocuments({});

    return NextResponse.json({
      success: true,
      deletedCount: r.deletedCount || 0,
      matchedBeforeDelete: matched,
      threshold: MIN_KEEP_QUALITY,
      ageGuardHours: SAFE_AGE_HOURS,
      totalBefore,
      totalAfter,
      message: `Deleted ${r.deletedCount || 0} pending+rejected pages below quality ${MIN_KEEP_QUALITY}`,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[cleanup-low-quality] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
