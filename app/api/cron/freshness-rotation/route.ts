export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';

/**
 * GET /api/cron/freshness-rotation — daily content-freshness signal.
 *
 * Why: Google's freshness algorithm rewards pages that update over time.
 * Even our high-quality auto-pages stagnate — once published, lastModified
 * never moves. Sites with rotating freshness signals out-perform static
 * sitemaps over a 90-day window.
 *
 * Behaviour:
 *   • Picks the 50 oldest indexable pages (publishedAt asc) that haven't
 *     been refreshed in the last 30 days.
 *   • Rebuilds each through seoContentBuilder so the year/date references
 *     embedded in the content actually update — not a cosmetic bump.
 *   • Recomputes qualityScore (drops anything that fell below 70 to
 *     un-indexable, flips back to indexable if still passing).
 *   • Updates publishedAt + updatedAt → sitemap.xml lastmod refreshes →
 *     Google's crawler revisits.
 *   • Fires an IndexNow ping for the refreshed URLs so Bing/Yandex pick
 *     it up within minutes (Google honours IndexNow informally).
 *
 * Schedule: daily at 03:30 UTC, after promote (02:00) and cleanup (03:00).
 *
 * Idempotent — repeat-runs same day skip pages already touched < 30d ago.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '483183bb8fa22f2e7a788fa911879510';
const REFRESH_PER_RUN = 50;
const MIN_AGE_DAYS = 30;
const MIN_KEEP_QUALITY = 70;

async function pingIndexNow(urls: string[]): Promise<{ ok: number; fail: number }> {
  let ok = 0;
  let fail = 0;
  if (urls.length === 0) return { ok: 0, fail: 0 };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(BASE_URL).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    if (res.status === 200 || res.status === 202) ok = urls.length;
    else fail = urls.length;
  } catch {
    fail = urls.length;
  }
  return { ok, fail };
}

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const cutoff = new Date(Date.now() - MIN_AGE_DAYS * 86400 * 1000);

    // Pick the oldest indexable pages whose publishedAt is older than cutoff.
    // Prefer publishedAt for staleness because that's what feeds sitemap lastmod.
    const stale = await SeoPage.find({
      isIndexable: true,
      $or: [
        { publishedAt: { $lt: cutoff } },
        { publishedAt: null, updatedAt: { $lt: cutoff } },
      ],
    })
      .select('slug keyword viralScore')
      .sort({ publishedAt: 1, updatedAt: 1 })
      .limit(REFRESH_PER_RUN)
      .lean();

    let refreshed = 0;
    let demoted = 0;
    const refreshedUrls: string[] = [];
    const ops: any[] = [];

    for (const p of stale as any[]) {
      const kw = (p.keyword || (p.slug as string).replace(/-/g, ' ')).trim();
      if (!kw) continue;

      const built = buildSeoContent(kw, { viralScore: p.viralScore || 90 });
      const newScore = computeQualityScore({
        wordCount: built.wordCount,
        viralScore: p.viralScore || 90,
        trendingRank: 0,
        views: 0,
        hashtagCount: built.hashtags.length,
        faqCount: built.faqs.length,
        slug: p.slug,
      });

      const now = new Date();
      const passes = newScore >= MIN_KEEP_QUALITY;
      const set: any = {
        title: built.title,
        metaTitle: built.metaTitle,
        metaDescription: built.metaDescription,
        content: built.content,
        hashtags: built.hashtags,
        relatedKeywords: built.relatedKeywords,
        faqs: built.faqs,
        category: built.category,
        wordCount: built.wordCount,
        qualityScore: newScore,
        isIndexable: passes,
        publishedAt: passes ? now : null,
      };
      ops.push({ updateOne: { filter: { slug: p.slug }, update: { $set: set } } });

      if (passes) {
        refreshed++;
        refreshedUrls.push(`${BASE_URL}/k/${p.slug}`);
      } else {
        demoted++;
      }
    }

    if (ops.length) await SeoPage.bulkWrite(ops, { ordered: false });

    const ping = await pingIndexNow(refreshedUrls);

    return NextResponse.json({
      success: true,
      scanned: stale.length,
      refreshed,
      demoted,
      indexNowPing: ping,
      sampleRefreshed: refreshedUrls.slice(0, 5),
      message: `Refreshed ${refreshed} pages · Demoted ${demoted} below quality ${MIN_KEEP_QUALITY} · IndexNow ${ping.ok}/${refreshedUrls.length} OK`,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[freshness-rotation] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
