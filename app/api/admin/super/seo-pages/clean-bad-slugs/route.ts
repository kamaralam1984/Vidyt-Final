import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import { scoreSlug } from '@/lib/slugQuality';

export const dynamic = 'force-dynamic';

/**
 * Admin: detect /k/ pages whose slugs look like spam ("best-best-best-…",
 * year-stacks, junk-fragment chains) and demote them out of the sitemap.
 *
 * Pages are NEVER deleted — only `isIndexable` is flipped to false. The
 * page document remains so the owner can manually fix or re-promote.
 *
 * Query params:
 *   ?action=dry  → preview only (default)
 *   ?action=run  → actually demote
 *   &limit=N     → cap pages scanned (default 5000, max 50000)
 *   &min=NN      → score-cutoff override (default 50, lower = stricter)
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'dry';
  const limit = Math.min(50000, Math.max(100, parseInt(url.searchParams.get('limit') || '5000', 10)));
  const minScore = Math.min(80, Math.max(20, parseInt(url.searchParams.get('min') || '50', 10)));
  const dryRun = action !== 'run';

  await connectDB();
  const total = await SeoPage.countDocuments({});
  const scanned = Math.min(total, limit);

  const cursor = SeoPage.find({})
    .select('slug isIndexable qualityScore')
    .sort({ _id: 1 })
    .limit(limit)
    .cursor({ batchSize: 200 });

  const flagsBucket: Record<string, number> = {};
  const scoreHistogram: Record<string, number> = { '90+': 0, '70-89': 0, '50-69': 0, '30-49': 0, '<30': 0 };
  const samples: { slug: string; score: number; flags: string[]; wasIndexable: boolean }[] = [];
  const demoteSlugs: string[] = [];

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const p: any = doc;
    const r = scoreSlug(p.slug);

    if (r.score >= 90) scoreHistogram['90+']++;
    else if (r.score >= 70) scoreHistogram['70-89']++;
    else if (r.score >= 50) scoreHistogram['50-69']++;
    else if (r.score >= 30) scoreHistogram['30-49']++;
    else scoreHistogram['<30']++;

    if (r.score < minScore) {
      // Aggregate the flag types so the operator sees what kinds of garbage dominate
      for (const f of r.flags) {
        const key = f.split('-').slice(0, 2).join('-'); // strip numeric suffix
        flagsBucket[key] = (flagsBucket[key] || 0) + 1;
      }
      if (samples.length < 30) {
        samples.push({
          slug: p.slug,
          score: r.score,
          flags: r.flags,
          wasIndexable: !!p.isIndexable,
        });
      }
      if (p.isIndexable) demoteSlugs.push(p.slug);
    }
  }

  let demoted = 0;
  if (!dryRun && demoteSlugs.length > 0) {
    const r = await SeoPage.updateMany(
      { slug: { $in: demoteSlugs } },
      { $set: { isIndexable: false, demotedReason: 'bad-slug', demotedAt: new Date() } },
    );
    demoted = r.modifiedCount || 0;
  }

  return NextResponse.json({
    success: true,
    mode: dryRun ? 'dry-run' : 'write',
    totalInDb: total,
    scanned,
    minScoreCutoff: minScore,
    scoreHistogram,
    flagsBucket,
    badSlugCount: samples.length === 30 ? '30+ (truncated)' : samples.length,
    eligibleForDemotion: demoteSlugs.length,
    demoted: dryRun ? 0 : demoted,
    samples: samples.slice(0, 20),
    note: dryRun
      ? `Found ${demoteSlugs.length} indexable pages with score<${minScore}. Call with ?action=run to demote them. Pages stay in DB — only isIndexable flips to false.`
      : `Demoted ${demoted} pages from sitemap. Their content remains in the DB; manually re-promote via the admin list if you fix them.`,
    timestamp: new Date().toISOString(),
  });
}
