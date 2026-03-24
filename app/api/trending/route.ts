export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getTrendingTopics } from '@/services/trendingEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords')?.split(',') || [];
    const platform = searchParams.get('platform') || 'youtube'; // youtube, facebook, instagram
    
    const trendingTopics = await getTrendingTopics(keywords, platform as 'youtube' | 'facebook' | 'instagram');
    
    return NextResponse.json({ trendingTopics, platform });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}
