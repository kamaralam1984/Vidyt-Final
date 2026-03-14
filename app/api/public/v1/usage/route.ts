import { NextRequest, NextResponse } from 'next/server';
import { getUserFromApiKey } from '@/lib/apiKeyAuth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const user = await getUserFromApiKey(request);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or missing API key. Use X-API-Key header.' }, { status: 401 });
  }
  try {
    await connectDB();
    const doc = await User.findById(user.id).select('usageStats subscription subscriptionExpiresAt').lean();
    const usage = doc?.usageStats || { videosAnalyzed: 0, analysesThisMonth: 0, competitorsTracked: 0 };
    return NextResponse.json({
      usage: {
        videosAnalyzed: usage.videosAnalyzed || 0,
        analysesThisMonth: usage.analysesThisMonth || 0,
        competitorsTracked: usage.competitorsTracked || 0,
      },
      subscription: doc?.subscription || 'free',
      subscriptionExpiresAt: doc?.subscriptionExpiresAt || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to get usage' }, { status: 500 });
  }
}
