export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/**
 * Database health check endpoint.
 * Public for backwards-compatibility (old cached clients call this).
 * Returns connection status only — no sensitive data exposed.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    return NextResponse.json({ status: 'connected' }, { headers: NO_CACHE });
  } catch {
    return NextResponse.json({ status: 'disconnected' }, { status: 503, headers: NO_CACHE });
  }
}
