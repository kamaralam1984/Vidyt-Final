export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Webhook from '@/models/Webhook';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const hook = await Webhook.findOne({ userId: authUser.id }).select('url events isActive').lean() as { url: string; events: string[]; isActive: boolean } | null;
    return NextResponse.json({ webhook: hook ? { url: hook.url, events: hook.events, isActive: hook.isActive } : null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to get webhook' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const url = (body.url || '').trim();
    if (!url || !url.startsWith('http')) return NextResponse.json({ error: 'Valid URL required' }, { status: 400 });
    await Webhook.findOneAndUpdate(
      { userId: authUser.id },
      { userId: authUser.id, url, events: ['analysis_complete'], isActive: true },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, message: 'Webhook saved. We will POST to this URL when an analysis completes.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save webhook' }, { status: 500 });
  }
}
