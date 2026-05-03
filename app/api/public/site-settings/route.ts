// Public read endpoint for SiteSettings — used by middleware (maintenance gate)
// and the SiteAnnouncementBanner client component.

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/getSiteSettings';

export async function GET() {
  const s = await getSiteSettings();
  return NextResponse.json(s, {
    headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=15' },
  });
}
