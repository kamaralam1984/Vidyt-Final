export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

/**
 * Public health check — used by login page backend indicator.
 * No auth required.
 */
export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: 'connected' });
  } catch {
    return NextResponse.json({ status: 'disconnected' }, { status: 503 });
  }
}
