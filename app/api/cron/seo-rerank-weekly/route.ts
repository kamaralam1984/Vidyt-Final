export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { rescorePage, INDEXABLE_THRESHOLD } from '@/lib/qualityScorer';
import { scoreSlug } from '@/lib/slugQuality';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '483183bb8fa22f2e7a788fa911879510';

/**
 * Weekly maintenance cron — re-scores every page, refreshes sitemap eligibility,
 * and pings IndexNow for the top quality movers.
 *
 * Steps:
 *   1) Cursor-iterate ALL SeoPage docs (no limit) — re-score with the latest
 *      qualityScorer (now incl. slug-quality penalty).
 *   2) Auto-demote indexable pages whose score dropped below
 *      INDEXABLE_THRESHOLD - 10 (hysteresis to prevent flapping).
 *   3) Auto-promote pending pages whose score crossed the threshold this week.
 *      We cap "auto-promote" at 200/week to avoid sitemap spikes.
 *   4) IndexNow-ping the URLs of the top-200 highest-quality indexable pages
 *      so Bing/Yandex (and Google via partnership) re-fetch them.
 *
 * Schedule:  0 4 * * 0   (every Sunday 04:00 UTC)
 *
 * Pages are NEVER deleted by this cron — only isIndexable flips.
 */
export async function GET(_request: NextRequest) {
  await connectDB();

  const cursor = SeoPage.find({})
    .select('slug keyword wordCount viralScore trendingRank views hashtags content qualityScore isIndexable')
    .cursor({ batchSize: 500 });

  const rescoreOps: any[] = [];
  const demoteSlugs: string[] = [];
  const promoteCandidates: { slug: string; score: number }[] = [];
  let scanned = 0;
  let badSlugDemotes = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const p: any = doc;
    scanned++;

    // 1) Re-score (qualityScorer reads slug + applies slug-quality penalty internally)
    const newScore = rescorePage(p);

    if (newScore !== p.qualityScore) {
      rescoreOps.push({
        updateOne: {
          filter: { slug: p.slug },
          update: { $set: { qualityScore: newScore } },
        },
      });
    }

    // 2) Hard slug-quality gate — garbage slugs are NEVER eligible
    const slugIsGarbage = scoreSlug(p.slug).isGarbage;

    if (p.isIndexable) {
      // Demotion: hysteresis at threshold-10 to avoid weekly flapping
      if (newScore < INDEXABLE_THRESHOLD - 10 || slugIsGarbage) {
        demoteSlugs.push(p.slug);
        if (slugIsGarbage) badSlugDemotes++;
      }
    } else {
      // Promotion candidate
      if (newScore >= INDEXABLE_THRESHOLD && !slugIsGarbage) {
        promoteCandidates.push({ slug: p.slug, score: newScore });
      }
    }
  }

  // 3) Apply rescores
  if (rescoreOps.length) {
    await SeoPage.bulkWrite(rescoreOps, { ordered: false });
  }

  // 4) Demote
  let demoted = 0;
  if (demoteSlugs.length) {
    const r = await SeoPage.updateMany(
      { slug: { $in: demoteSlugs } },
      { $set: { isIndexable: false } },
    );
    demoted = r.modifiedCount || 0;
  }

  // 5) Auto-promote (capped at 200/week)
  const WEEKLY_PROMOTE_CAP = 200;
  const toPromote = promoteCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, WEEKLY_PROMOTE_CAP)
    .map(p => p.slug);

  let promoted = 0;
  if (toPromote.length) {
    const r = await SeoPage.updateMany(
      { slug: { $in: toPromote } },
      { $set: { isIndexable: true, publishedAt: new Date() } },
    );
    promoted = r.modifiedCount || 0;
  }

  // 6) IndexNow-ping the top 200 highest-quality indexable pages
  let pingedOk = 0;
  let pingedFail = 0;
  try {
    const top = await SeoPage.find({ isIndexable: true })
      .select('slug')
      .sort({ qualityScore: -1, updatedAt: -1 })
      .limit(200)
      .lean();

    const urls = (top as any[]).map(p => `${BASE_URL}/k/${p.slug}`);
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
        if (res.ok || res.status === 202) pingedOk += batch.length;
        else pingedFail += batch.length;
      } catch {
        pingedFail += batch.length;
      }
    }
  } catch (e) {
    console.error('[seo-rerank-weekly] IndexNow ping failed:', e);
  }

  return NextResponse.json({
    success: true,
    scanned,
    rescored: rescoreOps.length,
    demoted,
    badSlugDemotes,
    promoted,
    promoteCandidatesFound: promoteCandidates.length,
    indexNow: { ok: pingedOk, fail: pingedFail },
    threshold: INDEXABLE_THRESHOLD,
    timestamp: new Date().toISOString(),
  });
}
