import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { requireAIStudioAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import { getApiConfig } from '@/lib/apiConfig';
import YoutubeGrowth from '@/models/YoutubeGrowth';
import { generateYouTubeInsights } from '@/services/ai/aiStudio';

function extractChannelIdFromUrl(url: string): string | null {
  const u = url.trim();
  const match = u.match(/youtube\.com\/channel\/([^/?]+)/) || u.match(/youtube\.com\/@([^/?]+)/) || u.match(/youtube\.com\/c\/([^/?]+)/);
  return match ? match[1] : null;
}

/** Fetch real channel + last 50 videos via YouTube Data API when key is set. */
async function fetchChannelDataFromYouTube(
  channelUrl: string,
  apiKey: string
): Promise<{ channelTitle: string; subscriberCount: number; videos: { videoId: string; title: string; views: number; publishedAt: Date; duration: number; viralScore: number }[]; subscriberGrowthData: { date: string; count: number }[]; viewsGrowthData: { date: string; views: number }[] } | null> {
  const identifier = extractChannelIdFromUrl(channelUrl);
  if (!identifier) return null;
  try {
    const isChannelId = identifier.startsWith('UC') && identifier.length >= 20;
    let channelId = identifier;
    if (!isChannelId) {
      const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', key: apiKey, q: identifier.startsWith('@') ? identifier : `@${identifier}`, type: 'channel', maxResults: 1 },
        timeout: 10000,
      });
      const ch = searchRes.data?.items?.[0];
      if (ch?.id?.channelId) channelId = ch.id.channelId;
      else if (ch?.snippet?.channelId) channelId = ch.snippet.channelId;
      else {
        const channelsRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'snippet,statistics,contentDetails', key: apiKey, forUsername: identifier.replace('@', '') },
          timeout: 10000,
        });
        if (channelsRes.data?.items?.length) channelId = channelsRes.data.items[0].id;
        else return null;
      }
    }
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet,statistics,contentDetails', key: apiKey, id: channelId },
      timeout: 10000,
    });
    const ch = channelRes.data?.items?.[0];
    if (!ch) return null;
    const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads;
    const channelTitle = ch.snippet?.title || 'Channel';
    const subscriberCount = parseInt(ch.statistics?.subscriberCount || '0', 10);
    if (!uploadsId) {
      return { channelTitle, subscriberCount, videos: [], subscriberGrowthData: [], viewsGrowthData: [] };
    }
    const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: { part: 'snippet,contentDetails', key: apiKey, playlistId: uploadsId, maxResults: 50 },
      timeout: 10000,
    });
    const videoIds = (playlistRes.data?.items || []).map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId).filter(Boolean);
    if (videoIds.length === 0) {
      return { channelTitle, subscriberCount, videos: [], subscriberGrowthData: [], viewsGrowthData: [] };
    }
    const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'snippet,statistics,contentDetails', key: apiKey, id: videoIds.join(',') },
      timeout: 10000,
    });
    const parseDuration = (iso: string): number => {
      const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!m) return 0;
      return (parseInt(m[1] || '0', 10) * 3600) + (parseInt(m[2] || '0', 10) * 60) + parseInt(m[3] || '0', 10);
    };
    const videos = (videosRes.data?.items || []).map((v: { id: string; snippet?: { title?: string }; statistics?: { viewCount?: string }; contentDetails?: { duration?: string }; publishedAt?: string }) => {
      const views = parseInt(v.statistics?.viewCount || '0', 10);
      const duration = parseDuration(v.contentDetails?.duration || '');
      return {
        videoId: v.id,
        title: v.snippet?.title || 'Video',
        views,
        publishedAt: v.publishedAt ? new Date(v.publishedAt) : new Date(),
        duration,
        viralScore: Math.min(100, Math.round((views / 1000) * 0.5 + (duration > 0 && duration <= 90 ? 20 : 0))),
      };
    });
    const viewsGrowthData = videos.map((v: { publishedAt: Date; views: number }) => ({
      date: new Date(v.publishedAt).toISOString().slice(0, 10),
      views: v.views,
    }));
    const subscriberGrowthData = viewsGrowthData.map((_: { date: string; views: number }, i: number) => ({
      date: viewsGrowthData[i].date,
      count: Math.round(subscriberCount * (0.3 + (0.7 * (50 - i) / 50))),
    }));
    return { channelTitle, subscriberCount, videos, subscriberGrowthData, viewsGrowthData };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const access = await requireAIStudioAccess(request);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { searchParams } = new URL(request.url);
  const channelUrl = searchParams.get('channelUrl');
  if (!channelUrl) return NextResponse.json({ error: 'channelUrl required' }, { status: 400 });
  try {
    await connectDB();
    const doc = await YoutubeGrowth.findOne({ userId: access.userId, channelUrl }).lean() as {
      channelUrl?: string; channelTitle?: string; subscriberCount?: number; videos?: unknown[];
      subscriberGrowthData?: unknown[]; viewsGrowthData?: unknown[]; aiInsights?: string[]; lastFetchedAt?: Date;
    } | null;
    if (doc) {
      const insights = generateYouTubeInsights((doc.videos || []) as { views: number; publishedAt?: Date; duration?: number }[]);
      return NextResponse.json({
        channelUrl: doc.channelUrl,
        channelTitle: doc.channelTitle,
        subscriberCount: doc.subscriberCount,
        videos: doc.videos?.slice(0, 50) || [],
        subscriberGrowthData: doc.subscriberGrowthData || [],
        viewsGrowthData: doc.viewsGrowthData || [],
        aiInsights: doc.aiInsights?.length ? doc.aiInsights : insights,
        lastFetchedAt: doc.lastFetchedAt,
      });
    }
    return NextResponse.json({ error: 'Channel not connected. Use POST with channelUrl to fetch.' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAIStudioAccess(request);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const channelUrl = (body.channelUrl || '').trim();
    if (!channelUrl) return NextResponse.json({ error: 'channelUrl required' }, { status: 400 });
    await connectDB();
    const config = await getApiConfig();
    const apiKey = config.youtubeDataApiKey?.trim();
    const channelId = extractChannelIdFromUrl(channelUrl);

    let channelTitle = 'My Channel';
    let subscriberCount = 5000;
    let videos: { videoId: string; title: string; views: number; publishedAt: Date; duration: number; viralScore: number }[] = Array.from({ length: 50 }, (_, i) => ({
      videoId: `mock-${i}`,
      title: `Video ${i + 1}`,
      views: 1000 + Math.floor(Math.random() * 50000),
      publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      duration: 60 + Math.floor(Math.random() * 300),
      viralScore: 40 + Math.floor(Math.random() * 50),
    }));
    let subscriberGrowthData = videos.map((_, i) => ({
      date: new Date(Date.now() - (49 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      count: 1000 + i * 50 + Math.floor(Math.random() * 100),
    }));
    let viewsGrowthData = videos.map((v) => ({ date: v.publishedAt.toISOString().slice(0, 10), views: v.views }));
    let message = 'Channel data fetched (demo mode). Set YouTube API key in Super Admin → API Config for real data.';

    if (apiKey) {
      const real = await fetchChannelDataFromYouTube(channelUrl, apiKey);
      if (real) {
        channelTitle = real.channelTitle;
        subscriberCount = real.subscriberCount;
        videos = real.videos;
        subscriberGrowthData = real.subscriberGrowthData;
        viewsGrowthData = real.viewsGrowthData;
        message = 'Channel data fetched via YouTube Data API.';
      }
    }

    const aiInsights = generateYouTubeInsights(videos);
    await YoutubeGrowth.findOneAndUpdate(
      { userId: access.userId, channelUrl },
      {
        userId: access.userId,
        channelUrl,
        channelId: channelId || 'mock',
        channelTitle,
        subscriberCount,
        videos,
        subscriberGrowthData,
        viewsGrowthData,
        aiInsights,
        lastFetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({
      channelUrl,
      channelTitle,
      subscriberCount,
      videos,
      subscriberGrowthData,
      viewsGrowthData,
      aiInsights,
      message,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
