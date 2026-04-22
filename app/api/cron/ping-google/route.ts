export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '483183bb8fa22f2e7a788fa911879510';

/**
 * Submits all site URLs to IndexNow (Bing, Yandex, Seznam — and Google via partnership).
 * Google Search Console API requires a separate service account setup.
 * GET /api/cron/ping-google
 */
export async function GET(request: NextRequest) {
  const results: { engine: string; status: string; count?: number }[] = [];

  // ── Build URL list ──
  const coreUrls = [
    `${BASE_URL}`,
    `${BASE_URL}/pricing`,
    `${BASE_URL}/about`,
    `${BASE_URL}/trending`,
    `${BASE_URL}/hashtags`,
    `${BASE_URL}/blog`,
    `${BASE_URL}/viral-optimizer`,
    `${BASE_URL}/posting-time`,
  ];

  // Fetch latest /k/ SEO pages from DB
  let kUrls: string[] = [];
  try {
    await connectDB();
    const SeoPage = (await import('@/models/SeoPage')).default;
    const pages = await SeoPage.find({})
      .sort({ createdAt: -1 })
      .limit(10000)
      .select('slug')
      .lean() as any[];
    kUrls = pages.map((p: any) => `${BASE_URL}/k/${p.slug}`);
  } catch { /* noop */ }

  const allUrls = [...coreUrls, ...kUrls];

  // ── IndexNow: submit in batches of 100 ──
  const BATCH = 100;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allUrls.length; i += BATCH) {
    const batch = allUrls.slice(i, i + BATCH);
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
      if (res.ok || res.status === 202) {
        successCount += batch.length;
      } else {
        failCount += batch.length;
      }
    } catch {
      failCount += batch.length;
    }
  }

  results.push({
    engine: 'IndexNow (Bing/Yandex)',
    status: failCount === 0 ? 'success' : `partial (${failCount} failed)`,
    count: successCount,
  });

  // ── Bing direct webmaster ping ──
  try {
    const res = await fetch(
      `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${process.env.BING_WEBMASTER_KEY || ''}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: BASE_URL, urlList: coreUrls }),
      }
    );
    results.push({ engine: 'Bing Webmaster', status: res.ok ? 'success' : `skipped (${res.status})` });
  } catch {
    results.push({ engine: 'Bing Webmaster', status: 'skipped (no key)' });
  }

  return NextResponse.json({
    success: true,
    totalUrls: allUrls.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
