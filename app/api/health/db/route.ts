export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

/**
 * Database health check endpoint — super-admin only
 */
export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role');
  if (role !== 'super-admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    return NextResponse.json({ status: 'connected' });
  } catch {
    return NextResponse.json({ status: 'disconnected' }, { status: 503 });
  }
}
