export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedChannelAnalytics } from '@/services/youtube/advancedChannelAnalytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = (body.url as string)?.trim();

    if (!url) {
      return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 });
    }

    const analytics = await getAdvancedChannelAnalytics(url);

    return NextResponse.json({ analytics });
  } catch (e: any) {
    console.error('YouTube Channel Analytics error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to analyze channel. Make sure the YouTube Data API key is configured.' },
      { status: 500 }
    );
  }
}
