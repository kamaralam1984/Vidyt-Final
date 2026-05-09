export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';
import { themeByIndex, SEO_THEMES, type SeoTheme } from '@/lib/seoTheme';

/**
 * POST /api/admin/super/seo-pages/backfill-themes
 *
 * One-shot maintenance endpoint: assigns one of the five themes to every
 * SeoPage that doesn't have one yet, and rebuilds thin content (wordCount
 * < 800) so the average qualityScore lifts off the 60s.
 *
 * Themes are distributed evenly: ~20% each across modern/magazine/viral/
 * longform/cards by stable hash of slug, so the same page always lands on
 * the same theme even across re-runs.
 *
 * Body: { rebuildContent?: boolean, limit?: number }
 *   rebuildContent — when true, also regenerates content+score for thin pages
 *   limit          — soft cap on processed docs per call (default 500)
 */
async function handle(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { rebuildContent?: boolean; limit?: number } = {};
  try { body = await request.json(); } catch { /* GET path or empty body */ }
  const rebuildContent = body.rebuildContent !== false; // default true
  const limit = Math.max(1, Math.min(2000, body.limit ?? 500));

  await connectDB();

  // Stable hash so reruns are idempotent for theme assignment.
  const slugHash = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };

  const docs = await SeoPage.find({})
    .select('slug keyword theme wordCount qualityScore source')
    .limit(limit)
    .lean();

  const ops: any[] = [];
  let themed = 0;
  let rebuilt = 0;
  const themeCounts: Record<SeoTheme, number> = {
    modern: 0, magazine: 0, viral: 0, longform: 0, cards: 0,
  };

  for (const p of docs as any[]) {
    const set: any = {};
    const validTheme = p.theme && (SEO_THEMES as string[]).includes(p.theme);

    if (!validTheme) {
      const t = themeByIndex(slugHash(p.slug));
      set.theme = t;
      themeCounts[t]++;
      themed++;
    } else {
      themeCounts[p.theme as SeoTheme]++;
    }

    // Rebuild thin / low-quality pages so the dataset average lifts.
    if (rebuildContent && (p.wordCount < 800 || (p.qualityScore || 0) < 70)) {
      const kw = (p.keyword || (p.slug as string).replace(/-/g, ' ')).trim();
      if (kw) {
        const built = buildSeoContent(kw);
        const score = computeQualityScore({
          wordCount: built.wordCount,
          viralScore: 80,
          trendingRank: 0,
          views: 0,
          hashtagCount: built.hashtags.length,
          faqCount: built.faqs.length,
          slug: p.slug,
        });
        if (score >= (p.qualityScore || 0)) {
          set.title = built.title;
          set.metaTitle = built.metaTitle;
          set.metaDescription = built.metaDescription;
          set.content = built.content;
          set.hashtags = built.hashtags;
          set.relatedKeywords = built.relatedKeywords;
          set.faqs = built.faqs;
          set.category = built.category;
          set.wordCount = built.wordCount;
          set.qualityScore = score;
          rebuilt++;
        }
      }
    }

    if (Object.keys(set).length) {
      ops.push({ updateOne: { filter: { slug: p.slug }, update: { $set: set } } });
    }
  }

  if (ops.length) await SeoPage.bulkWrite(ops, { ordered: false });

  return NextResponse.json({
    success: true,
    scanned: docs.length,
    themed,
    rebuilt,
    themeCounts,
    message: `Themed ${themed}, rebuilt ${rebuilt} of ${docs.length} scanned`,
    timestamp: new Date().toISOString(),
  });
}

export const POST = handle;
export const GET = handle;
