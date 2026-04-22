import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';

export const dynamic = 'force-dynamic';

/**
 * Admin-only: rebuild existing SeoPage docs with rich content + quality scores.
 *
 * Query params:
 *   ?action=dry    → preview score distribution, no writes (default)
 *   ?action=run    → perform writes
 *   &limit=N       → cap how many docs to process (default: 500 per call)
 *   &offset=N      → skip first N docs (for paginated runs)
 *
 * Returns quality histogram so operator can verify before running for real.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'dry';
  const limit = Math.min(2000, Math.max(1, parseInt(url.searchParams.get('limit') || '500', 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
  const dryRun = action !== 'run';

  await connectDB();
  const total = await SeoPage.countDocuments({});

  const cursor = SeoPage.find({})
    .select('slug keyword viralScore trendingRank views')
    .sort({ _id: 1 })
    .skip(offset)
    .limit(limit)
    .cursor({ batchSize: 50 });

  const histogram: Record<string, number> = { '90+': 0, '80-89': 0, '70-79': 0, '60-69': 0, '<60': 0 };
  const ops: any[] = [];
  let processed = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const p: any = doc;
    const kw = (p.keyword || '').trim();
    if (!kw) { processed++; continue; }

    const viralScore = p.viralScore > 0 ? p.viralScore : 72;
    const isTrending = (p.trendingRank || 0) > 0;

    const built = buildSeoContent(kw, {
      viralScore,
      trendingRank: p.trendingRank || 0,
      isTrending,
    });

    const qualityScore = computeQualityScore({
      wordCount: built.wordCount,
      viralScore,
      trendingRank: p.trendingRank || 0,
      views: p.views || 0,
      hashtagCount: built.hashtags.length,
      faqCount: built.faqs.length,
    });

    if (qualityScore >= 90) histogram['90+']++;
    else if (qualityScore >= 80) histogram['80-89']++;
    else if (qualityScore >= 70) histogram['70-79']++;
    else if (qualityScore >= 60) histogram['60-69']++;
    else histogram['<60']++;

    if (!dryRun) {
      ops.push({
        updateOne: {
          filter: { slug: p.slug },
          update: {
            $set: {
              title: built.title,
              metaTitle: built.metaTitle,
              metaDescription: built.metaDescription,
              content: built.content,
              hashtags: built.hashtags,
              relatedKeywords: built.relatedKeywords,
              category: built.category,
              wordCount: built.wordCount,
              qualityScore,
              viralScore,
            },
          },
        },
      });
    }
    processed++;
  }

  let modified = 0;
  if (!dryRun && ops.length) {
    const r = await SeoPage.bulkWrite(ops, { ordered: false });
    modified = r.modifiedCount || 0;
  }

  const eligible = histogram['90+'] + histogram['80-89'] + histogram['70-79'];
  const nextOffset = offset + processed;
  const hasMore = nextOffset < total;

  return NextResponse.json({
    success: true,
    mode: dryRun ? 'dry-run' : 'write',
    totalInDb: total,
    offset,
    limit,
    processed,
    modified: dryRun ? 0 : modified,
    qualityHistogram: histogram,
    eligibleForSitemap: eligible,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
    note: dryRun
      ? `Dry-run complete. ${eligible} of ${processed} pages would be eligible for sitemap promotion. Call with ?action=run to actually rewrite.`
      : `Rewrote ${modified} pages. ${hasMore ? `Call again with ?action=run&offset=${nextOffset} to continue.` : 'All pages processed. Now hit /api/cron/promote-seo-pages to promote top 100 to sitemap.'}`,
    timestamp: new Date().toISOString(),
  });
}
