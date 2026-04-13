export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getTrendingTopics } from '@/services/trendingEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords')?.split(',').filter(Boolean) || [];
    const platform = (searchParams.get('platform') || 'youtube') as 'youtube' | 'facebook' | 'instagram' | 'tiktok';

    const trendingTopics = await getTrendingTopics(keywords, platform);

    // Map to include all fields for frontend
    const mapped = trendingTopics.map((t) => ({
      keyword: t.keyword,
      score: t.score,
      category: t.category || 'Trending',
      rank: t.rank || 0,
      source: t.source,
      confidence: t.confidence,
    }));

    return NextResponse.json({
      trendingTopics: mapped,
      platform,
      total: mapped.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json({ error: 'Failed to fetch trending topics', trendingTopics: [] }, { status: 500 });
  }
}
