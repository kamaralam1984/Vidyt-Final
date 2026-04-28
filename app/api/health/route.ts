export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

import os from 'os';

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/**
 * Public health check — used by login page backend indicator.
 * No auth required.
 */
export async function GET() {
  const serverId = os.hostname();
  // Fast path: reuse existing connection if already open (readyState 1 = connected)
  if (mongoose.connection?.readyState === 1) {
    return NextResponse.json({ status: 'connected', serverId }, { headers: NO_CACHE });
  }

  try {
    await connectDB();
    return NextResponse.json({ status: 'connected', serverId }, { headers: NO_CACHE });
  } catch {
    return NextResponse.json({ status: 'disconnected', serverId }, { status: 503, headers: NO_CACHE });
  }
}
