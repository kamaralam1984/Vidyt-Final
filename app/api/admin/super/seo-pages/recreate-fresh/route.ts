// One-click pipeline: trigger every generator + the promote cron in sequence
// so the admin can rebuild the /k/ backlog from clean curated + trending
// sources without juggling multiple URLs.
//
// Each underlying cron is idempotent and skips slugs that already exist, so
// calling this repeatedly across days keeps producing new pages.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';

async function step(request: NextRequest, path: string) {
  try {
    const url = new URL(path, request.url);
    const res = await fetch(url.toString(), {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    return { path, ok: res.ok, status: res.status, ...json };
  } catch (e: any) {
    return { path, ok: false, error: e?.message || String(e) };
  }
}

async function recreate(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const startedAt = new Date().toISOString();

  // Sequential so each step's writes are visible to the next: curated pages
  // first, then trending feeds, then quality-gated promotion + IndexNow ping.
  const curated = await step(request, '/api/cron/generate-seo-pages');
  const trending = await step(request, '/api/cron/generate-trending-pages');
  const promoted = await step(request, '/api/cron/promote-seo-pages');

  return NextResponse.json({
    success: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    steps: { curated, trending, promoted },
    message: `Pipeline complete. New curated: ${curated.created || 0}, new trending: ${trending.created || 0}, promoted: ${promoted.promoted || 0}.`,
  });
}

export const POST = recreate;
export const GET = recreate;
