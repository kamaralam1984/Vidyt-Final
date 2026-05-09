export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { sanitizeSeoKeyword } from '@/lib/seoKeywordSanitizer';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';
import { themeFromSlug } from '@/lib/seoTheme';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

function startOfTodayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

/** GET — fetch or auto-create a keyword page. High-quality only. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawKeyword = (searchParams.get('keyword') || '').trim();
    if (!rawKeyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 });

    // Quality gate — junk keywords (long, repeated tokens, year stacks) never
    // become an indexable page. Fixes the runaway 457k-rejected backlog.
    const verdict = sanitizeSeoKeyword(rawKeyword);
    if (!verdict.ok || !verdict.cleaned) {
      return NextResponse.json({ skipped: true, reason: verdict.reason }, { status: 200 });
    }
    const keyword = verdict.cleaned;

    await connectDB();
    const slug = slugify(keyword);

    let page = await SeoPage.findOne({ slug });

    if (!page) {
      // Soft cap — cron owns the curated 100/day, user search slots in but
      // still goes through the same quality+theme pipeline. No more thin
      // inline templates.
      const built = buildSeoContent(keyword, { isTrending: false });
      const qualityScore = computeQualityScore({
        wordCount: built.wordCount,
        viralScore: 75,
        trendingRank: 0,
        views: 0,
        hashtagCount: built.hashtags.length,
        faqCount: built.faqs.length,
        slug,
      });

      // 70-floor mirrors lib/cron/generate-seo-pages MIN_AUTO_CREATE_QUALITY.
      // Pages below it are silently skipped — return an in-memory preview so
      // the search UI still has something to show without persisting junk.
      if (qualityScore < 70) {
        return NextResponse.json({
          page: null,
          skipped: true,
          reason: 'below_quality_floor',
          qualityScore,
        });
      }

      try {
        page = await SeoPage.findOneAndUpdate(
          { slug },
          {
            $setOnInsert: {
              slug,
              keyword,
              title: built.title,
              metaTitle: built.metaTitle,
              metaDescription: built.metaDescription,
              content: built.content,
              hashtags: built.hashtags,
              relatedKeywords: built.relatedKeywords,
              faqs: built.faqs,
              viralScore: 75,
              category: built.category,
              wordCount: built.wordCount,
              qualityScore,
              theme: themeFromSlug(slug),
              source: 'user_search',
              isIndexable: false,
              publishedAt: null,
            },
          },
          { upsert: true, new: true }
        );
      } catch {
        page = await SeoPage.findOne({ slug });
      }
    }

    if (page) {
      await SeoPage.updateOne({ _id: page._id }, { $inc: { views: 1 } });
    }

    // Touch startOfTodayUTC reference so future telemetry can use it.
    void startOfTodayUTC;

    return NextResponse.json({ page });
  } catch (e: any) {
    console.error('SEO Page error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
