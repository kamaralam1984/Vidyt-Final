export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { getApiConfig } from '@/lib/apiConfig';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'youtube_seo');
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('keyword') || searchParams.get('q') || '').trim();
  const maxResults = Math.min(parseInt(searchParams.get('max') || '10', 10) || 10, 25);

  if (!keyword) {
    return NextResponse.json({ competitors: [], message: 'Provide keyword query.' });
  }

  const config = await getApiConfig();
  const apiKey = config.youtubeDataApiKey?.trim();

  if (!apiKey) {
    const hash = keyword.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const mock = Array.from({ length: Math.min(10, maxResults) }, (_, i) => ({
      videoId: `fallback-${i}`,
      title: `${keyword} - Top Insight ${i + 1}`,
      views: 10000 + ((hash * (i + 1)) % 500000),
      channelTitle: `Creator ${i + 1}`,
      publishedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      thumbnailUrl: '',
      description: `Detailed walkthrough of ${keyword}.`,
      videoUrl: `https://www.youtube.com/watch?v=fallback-${i}`,
      relevanceScore: Math.max(45, 95 - i * 5),
    }));
    return NextResponse.json({ competitors: mock, source: 'offline-fallback', searchKeyword: keyword });
  }
  try {
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: keyword,
        type: 'video',
        maxResults,
        key: apiKey,
        order: 'viewCount',
      },
      timeout: 10000,
    });

    const items = searchRes.data?.items || [];
    if (items.length === 0) return NextResponse.json({ competitors: [] });

    const videoIds = items.map((i: { id?: { videoId?: string } }) => i.id?.videoId).filter(Boolean);
    const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics',
        id: videoIds.join(','),
        key: apiKey,
      },
      timeout: 10000,
    });

    const videos = (videosRes.data?.items || []).map((v: { id: string; snippet?: { title?: string; description?: string; channelTitle?: string; channelId?: string; thumbnails?: { default?: { url?: string }; medium?: { url?: string } }; publishedAt?: string }; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }, idx: number) => ({
      videoId: v.id,
      title: v.snippet?.title || 'Untitled',
      views: parseInt(v.statistics?.viewCount || '0', 10),
      channelTitle: v.snippet?.channelTitle || '',
      channelId: v.snippet?.channelId || '',
      publishedAt: v.snippet?.publishedAt || '',
      thumbnailUrl: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
      description: v.snippet?.description || '',
      videoUrl: `https://www.youtube.com/watch?v=${v.id}`,
      likeCount: parseInt(v.statistics?.likeCount || '0', 10),
      commentCount: parseInt(v.statistics?.commentCount || '0', 10),
      relevanceScore: Math.max(50, 98 - idx * 5),
    }));

    return NextResponse.json({ competitors: videos, source: 'youtube', searchKeyword: keyword });
  } catch (e) {
    const hash = keyword.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const mock = Array.from({ length: Math.min(10, maxResults) }, (_, i) => ({
      videoId: `fallback-${i}`,
      title: `${keyword} - Top Insight ${i + 1}`,
      views: 5000 + ((hash * (i + 1)) % 100000),
      channelTitle: `Creator ${i + 1}`,
      publishedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      thumbnailUrl: '',
      description: `Detailed walkthrough of ${keyword}.`,
      videoUrl: '#',
      relevanceScore: Math.max(45, 95 - i * 5),
    }));
    return NextResponse.json({ competitors: mock, source: 'fallback', searchKeyword: keyword });
  }
}
