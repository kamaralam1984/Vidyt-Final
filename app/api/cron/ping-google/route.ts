export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

/**
 * Ping Google & Bing to re-crawl the sitemap.
 * Call daily after generating new SEO pages.
 * GET /api/cron/ping-google
 */
export async function GET(request: NextRequest) {
  const sitemapUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vidyt.com'}/sitemap.xml`;
  const results: { engine: string; status: string }[] = [];

  // 1. Ping Google
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { method: 'GET' });
    results.push({ engine: 'Google', status: res.ok ? 'success' : `failed (${res.status})` });
  } catch (e: any) {
    results.push({ engine: 'Google', status: `error: ${e.message}` });
  }

  // 2. Ping Bing
  try {
    const res = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { method: 'GET' });
    results.push({ engine: 'Bing', status: res.ok ? 'success' : `failed (${res.status})` });
  } catch (e: any) {
    results.push({ engine: 'Bing', status: `error: ${e.message}` });
  }

  // 3. Ping IndexNow (Bing/Yandex instant indexing)
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vidyt.com').hostname,
        key: process.env.INDEXNOW_KEY || 'vidyt-indexnow-key',
        urlList: [sitemapUrl],
      }),
    });
    results.push({ engine: 'IndexNow', status: res.ok ? 'success' : `failed (${res.status})` });
  } catch (e: any) {
    results.push({ engine: 'IndexNow', status: `error: ${e.message}` });
  }

  return NextResponse.json({
    success: true,
    sitemapUrl,
    results,
    timestamp: new Date().toISOString(),
  });
}
