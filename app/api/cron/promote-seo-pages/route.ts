export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { rescorePage, INDEXABLE_THRESHOLD, DAILY_PROMOTION_CAP } from '@/lib/qualityScorer';

/**
 * Daily cron — quality-gated sitemap promotion.
 *
 * Picks the top DAILY_PROMOTION_CAP unpublished pages by qualityScore
 * (≥ INDEXABLE_THRESHOLD only) and flips them to isIndexable:true.
 * Also re-scores previously-published pages and demotes any that fell
 * below the threshold (e.g., content decayed, competitors passed them).
 *
 * Flow:
 *   1. Re-score all unpublished pages (views may have grown since creation)
 *   2. Sort by qualityScore DESC, pick top 100 that pass threshold
 *   3. Set isIndexable=true + publishedAt=now
 *   4. Fire IndexNow ping for the newly promoted URLs
 *   5. Demote previously-indexable pages that fell below threshold
 *
 * Schedule: daily at 02:00 UTC (before Googlebot's active hours).
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '483183bb8fa22f2e7a788fa911879510';

async function pingIndexNow(urls: string[]): Promise<{ ok: number; fail: number }> {
  let ok = 0;
  let fail = 0;
  const BATCH = 100;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: new URL(BASE_URL).hostname,
          key: INDEXNOW_KEY,
          keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: batch,
        }),
      });
      if (res.ok || res.status === 202) ok += batch.length;
      else fail += batch.length;
    } catch {
      fail += batch.length;
    }
  }
  return { ok, fail };
}

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const now = new Date();

    // ── 1) Re-score all un-indexable candidates ─────────────────────────
    const candidates = await SeoPage.find({ isIndexable: { $ne: true } })
      .select('slug wordCount viralScore trendingRank views hashtags content qualityScore')
      .limit(10000)
      .lean();

    const rescored: { slug: string; score: number }[] = [];
    const rescoreOps: any[] = [];
    for (const p of candidates as any[]) {
      const score = rescorePage(p);
      rescored.push({ slug: p.slug, score });
      if (score !== p.qualityScore) {
        rescoreOps.push({
          updateOne: {
            filter: { slug: p.slug },
            update: { $set: { qualityScore: score } },
          },
        });
      }
    }
    if (rescoreOps.length) await SeoPage.bulkWrite(rescoreOps, { ordered: false });

    // ── 2) Pick top N that pass threshold ───────────────────────────────
    const eligible = rescored
      .filter(r => r.score >= INDEXABLE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, DAILY_PROMOTION_CAP);

    // ── 3) Promote them ─────────────────────────────────────────────────
    let promoted = 0;
    const promotedUrls: string[] = [];
    if (eligible.length) {
      const slugs = eligible.map(e => e.slug);
      const result = await SeoPage.updateMany(
        { slug: { $in: slugs }, isIndexable: { $ne: true } },
        { $set: { isIndexable: true, publishedAt: now } }
      );
      promoted = result.modifiedCount || 0;
      for (const slug of slugs) promotedUrls.push(`${BASE_URL}/k/${slug}`);
    }

    // ── 4) Ping IndexNow so Bing/Yandex (and Google via partnership) crawl fast
    let pingResult = { ok: 0, fail: 0 };
    if (promotedUrls.length) {
      // Always include homepage + sitemap to re-trigger discovery
      pingResult = await pingIndexNow([
        BASE_URL,
        `${BASE_URL}/sitemap.xml`,
        ...promotedUrls,
      ]);
    }

    // ── 5) Demote pages that decayed below threshold ────────────────────
    //     Re-score currently-indexable pages too; drop ones that slipped.
    const published = await SeoPage.find({ isIndexable: true })
      .select('slug wordCount viralScore trendingRank views hashtags content')
      .limit(5000)
      .lean();

    const demoteSlugs: string[] = [];
    const pubRescoreOps: any[] = [];
    for (const p of published as any[]) {
      const score = rescorePage(p);
      pubRescoreOps.push({
        updateOne: {
          filter: { slug: p.slug },
          update: { $set: { qualityScore: score } },
        },
      });
      if (score < INDEXABLE_THRESHOLD - 10) {
        // Hysteresis: only demote if clearly below (threshold - 10) to avoid flapping
        demoteSlugs.push(p.slug);
      }
    }
    if (pubRescoreOps.length) await SeoPage.bulkWrite(pubRescoreOps, { ordered: false });

    let demoted = 0;
    if (demoteSlugs.length) {
      const r = await SeoPage.updateMany(
        { slug: { $in: demoteSlugs } },
        { $set: { isIndexable: false } }
      );
      demoted = r.modifiedCount || 0;
    }

    return NextResponse.json({
      success: true,
      candidatesScanned: candidates.length,
      eligibleCount: eligible.length,
      promoted,
      demoted,
      indexNowPing: pingResult,
      threshold: INDEXABLE_THRESHOLD,
      cap: DAILY_PROMOTION_CAP,
      topScores: eligible.slice(0, 5),
      timestamp: now.toISOString(),
    });
  } catch (e: any) {
    console.error('[promote-seo-pages] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
