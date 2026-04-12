export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL('/api/admin/super/analytics/revenue', request.url);
  return NextResponse.redirect(url, 307);
}
