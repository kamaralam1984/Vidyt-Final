import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';
import { isGarbageSlug } from '@/lib/slugQuality';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/super/seo-pages/bulk
 * body: { action: 'delete' | 'promote' | 'demote' | 'rebuild' | 'promote-all', slugs?: string[] }
 *
 * 'promote-all' marks EVERY non-indexable page as indexable in one shot
 * (skips only literal garbage slugs). No slugs array needed.
 * 'rebuild' re-runs buildSeoContent + recomputes qualityScore for each slug.
 * Page rows are never deleted by this action — only their content fields
 * and qualityScore change.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  await connectDB();
  let affected = 0;

  // ── promote-all: no slugs needed — index everything non-garbage ──────────
  if (body.action === 'promote-all') {
    const all = await SeoPage.find({ isIndexable: { $ne: true } })
      .select('slug')
      .lean() as any[];
    const goodSlugs = all
      .map((p: any) => p.slug as string)
      .filter((s: string) => s && !isGarbageSlug(s));
    if (goodSlugs.length === 0) {
      return NextResponse.json({ success: true, action: 'promote-all', affected: 0, message: 'Nothing to promote' });
    }
    const BATCH = 1000;
    for (let i = 0; i < goodSlugs.length; i += BATCH) {
      const batch = goodSlugs.slice(i, i + BATCH);
      const r = await SeoPage.updateMany(
        { slug: { $in: batch }, isIndexable: { $ne: true } },
        { $set: { isIndexable: true, publishedAt: new Date() } }
      );
      affected += r.modifiedCount || 0;
    }
    return NextResponse.json({ success: true, action: 'promote-all', affected, total: goodSlugs.length });
  }

  if (!Array.isArray(body.slugs) || body.slugs.length === 0) {
    return NextResponse.json({ error: 'Provide slugs array' }, { status: 400 });
  }
  const slugs: string[] = body.slugs.filter((s: any) => typeof s === 'string').slice(0, 500);
  if (slugs.length === 0) return NextResponse.json({ error: 'No valid slugs' }, { status: 400 });

  if (body.action === 'delete') {
    const r = await SeoPage.deleteMany({ slug: { $in: slugs } });
    affected = r.deletedCount || 0;
  } else if (body.action === 'promote') {
    const r = await SeoPage.updateMany(
      { slug: { $in: slugs } },
      { $set: { isIndexable: true, publishedAt: new Date() } }
    );
    affected = r.modifiedCount || 0;
  } else if (body.action === 'demote') {
    const r = await SeoPage.updateMany(
      { slug: { $in: slugs } },
      { $set: { isIndexable: false } }
    );
    affected = r.modifiedCount || 0;
  } else if (body.action === 'rebuild') {
    const docs = await SeoPage.find({ slug: { $in: slugs } })
      .select('slug keyword viralScore trendingRank views')
      .lean();
    const ops: any[] = [];
    for (const p of docs as any[]) {
      const kw = (p.keyword || (p.slug as string).replace(/-/g, ' ')).trim();
      if (!kw) continue;
      const built = buildSeoContent(kw, {
        viralScore: p.viralScore || 72,
        trendingRank: p.trendingRank || 0,
        isTrending: (p.trendingRank || 0) > 0,
      });
      const qualityScore = computeQualityScore({
        wordCount: built.wordCount,
        viralScore: p.viralScore || 72,
        trendingRank: p.trendingRank || 0,
        views: p.views || 0,
        hashtagCount: built.hashtags.length,
        faqCount: built.faqs.length,
        slug: p.slug,
      });
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
            },
          },
        },
      });
    }
    if (ops.length) {
      const r = await SeoPage.bulkWrite(ops, { ordered: false });
      affected = r.modifiedCount || 0;
    }
  } else {
    return NextResponse.json({ error: 'action must be delete|promote|demote|rebuild' }, { status: 400 });
  }

  return NextResponse.json({ success: true, action: body.action, affected, requested: slugs.length });
}
