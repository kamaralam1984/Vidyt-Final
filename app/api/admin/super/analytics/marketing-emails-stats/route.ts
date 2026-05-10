export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MarketingEmail from '@/models/MarketingEmail';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

/**
 * GET /api/admin/super/analytics/marketing-emails-stats
 *
 * Surfaces the live state of the automated-marketing-email cron in the
 * admin Live dashboard. Counts:
 *   • total / 7d / 24h sent emails per category (welcome / drip / upgrade)
 *   • last-sent timestamp per category (proxy for "is the cron running?")
 *   • failure rate
 *
 * Categories are derived from MarketingEmail.emailType:
 *   welcome              → Welcome
 *   feature_drip_*       → Drip
 *   upgrade_nudge        → Upgrade Nudge
 *   upgrade_premium      → Premium Upgrade
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const access = await requireSuperAdminAccess(request);
    if (access.error) return access.error;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const since7d = new Date(now - 7 * day);
    const since24h = new Date(now - 1 * day);

    type Bucket = 'welcome' | 'drip' | 'upgradeNudge' | 'upgradePremium';
    const bucketOf = (t: string): Bucket | null => {
      if (t === 'welcome') return 'welcome';
      if (t.startsWith('feature_drip_')) return 'drip';
      if (t === 'upgrade_nudge') return 'upgradeNudge';
      if (t === 'upgrade_premium') return 'upgradePremium';
      return null;
    };

    const empty = () => ({ total: 0, last7d: 0, last24h: 0, failed: 0, lastSentAt: null as string | null });
    const stats: Record<Bucket, ReturnType<typeof empty>> = {
      welcome: empty(),
      drip: empty(),
      upgradeNudge: empty(),
      upgradePremium: empty(),
    };

    const aggResult = await MarketingEmail.aggregate([
      {
        $group: {
          _id: '$emailType',
          total: { $sum: 1 },
          last7d: { $sum: { $cond: [{ $gte: ['$sentAt', since7d] }, 1, 0] } },
          last24h: { $sum: { $cond: [{ $gte: ['$sentAt', since24h] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          lastSentAt: { $max: '$sentAt' },
        },
      },
    ]);

    for (const r of aggResult as any[]) {
      const b = bucketOf(r._id as string);
      if (!b) continue;
      stats[b].total += r.total;
      stats[b].last7d += r.last7d;
      stats[b].last24h += r.last24h;
      stats[b].failed += r.failed;
      const ts = r.lastSentAt ? new Date(r.lastSentAt).toISOString() : null;
      if (ts && (!stats[b].lastSentAt || ts > stats[b].lastSentAt)) {
        stats[b].lastSentAt = ts;
      }
    }

    // Most recent sentAt across the whole collection — used as the "last
    // cron run" proxy on the dashboard.
    const lastEmail = await MarketingEmail.findOne({})
      .sort({ sentAt: -1 })
      .select('sentAt')
      .lean<{ sentAt: Date } | null>();
    const lastRunAt = lastEmail?.sentAt ? new Date(lastEmail.sentAt).toISOString() : null;

    const totals = {
      total: Object.values(stats).reduce((s, v) => s + v.total, 0),
      last7d: Object.values(stats).reduce((s, v) => s + v.last7d, 0),
      last24h: Object.values(stats).reduce((s, v) => s + v.last24h, 0),
      failed: Object.values(stats).reduce((s, v) => s + v.failed, 0),
    };

    return NextResponse.json({
      stats,
      totals,
      lastRunAt,
      cronConfigured: !!process.env.CRON_SECRET,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[marketing-emails-stats]', e?.message || e);
    return NextResponse.json({ error: 'Failed to load stats', detail: String(e?.message || e) }, { status: 500 });
  }
}
