export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { requireAIStudioAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import { getApiConfig } from '@/lib/apiConfig';
import YoutubeGrowth from '@/models/YoutubeGrowth';
import { generateYouTubeInsights } from '@/services/ai/aiStudio';

function extractChannelIdFromUrl(url: string): string | null {
  const u = url.trim();
  // Handle full URLs
  const match = u.match(/youtube\.com\/channel\/([^/?]+)/) || 
                u.match(/youtube\.com\/@([^/?]+)/) || 
                u.match(/youtube\.com\/c\/([^/?]+)/);
  if (match) return match[1];
  
  // Handle raw handles or IDs
  if (u.startsWith('@')) return u.slice(1);
  if (u.startsWith('UC') && u.length >= 20) return u;
  
  return u || null;
}

/** Fetch real channel + last 50 videos via YouTube Data API when key is set. */
async function fetchChannelDataFromYouTube(
  channelUrl: string,
  apiKey: string,
  range: string = 'month'
): Promise<{
  channelTitle: string;
  subscriberCount: number;
  totalWatchTime: number;
  totalLikes: number;
  videos: any[];
  subscriberGrowthData: { date: string; count: number; gained?: number }[];
  viewsGrowthData: { date: string; views: number }[];
  range: string;
  videosInRange: number;
} | null> {
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
    const totalViews = parseInt(ch.statistics?.viewCount || '0', 10);
    
    let videos: any[] = [];
    let totalWatchTime = 0;
    let totalLikes = 0;

    if (uploadsId) {
      const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: { part: 'snippet,contentDetails', key: apiKey, playlistId: uploadsId, maxResults: 50 },
        timeout: 10000,
      });
      const videoIds = (playlistRes.data?.items || []).map((i: any) => i.contentDetails?.videoId).filter(Boolean);
      if (videoIds.length > 0) {
        const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet,statistics,contentDetails', key: apiKey, id: videoIds.join(',') },
          timeout: 10000,
        });
        const parseDuration = (iso: string): number => {
          const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (!m) return 0;
          return (parseInt(m[1] || '0', 10) * 3600) + (parseInt(m[2] || '0', 10) * 60) + parseInt(m[3] || '0', 10);
        };
        videos = (videosRes.data?.items || []).map((v: any) => {
          const views = parseInt(v.statistics?.viewCount || '0', 10);
          const likes = parseInt(v.statistics?.likeCount || '0', 10);
          const comments = parseInt(v.statistics?.commentCount || '0', 10);
          const duration = parseDuration(v.contentDetails?.duration || '');
          totalLikes += likes;
          const engagementRate = views > 0 ? Math.round(((likes + comments) / views) * 10000) / 100 : 0;
          return {
            videoId: v.id,
            title: v.snippet?.title || 'Video',
            views,
            likes,
            comments,
            engagementRate,
            publishedAt: v.snippet?.publishedAt ? new Date(v.snippet.publishedAt) : new Date(),
            duration,
            viralScore: Math.min(100, Math.round(
              (views > 0 ? Math.min(40, views / 5000) : 0) +
              (engagementRate > 5 ? 30 : engagementRate > 2 ? 20 : engagementRate > 0.5 ? 10 : 0) +
              (duration > 0 && duration <= 90 ? 20 : duration <= 300 ? 10 : 5) +
              (comments > 10 ? 10 : comments > 0 ? 5 : 0)
            )),
          };
        });
      }
    }

    // Build growth data from videos filtered by selected range
    const viewsGrowthData: { date: string; views: number }[] = [];
    const subscriberGrowthData: { date: string; count: number; gained?: number }[] = [];

    // Sort all videos oldest first
    const sortedAll = [...videos].sort((a: any, b: any) =>
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );

    // Filter strictly by range
    const now = new Date();
    const rangeMs = range === 'today' ? 24*60*60*1000 : range === 'week' ? 7*24*60*60*1000 : range === 'year' ? 365*24*60*60*1000 : 30*24*60*60*1000;
    const rangeStart = new Date(now.getTime() - rangeMs);
    const rangeVideos = sortedAll.filter((v: any) => new Date(v.publishedAt) >= rangeStart);

    // Recalculate stats for ONLY the filtered range
    let rangeWatchTime = 0;
    let rangeLikes = 0;
    let rangeViews = 0;

    if (rangeVideos.length > 0) {
      const totalEstSubsGained = rangeVideos.reduce((s: number, v: any) => {
        const cr = v.engagementRate > 5 ? 0.008 : v.engagementRate > 2 ? 0.004 : v.engagementRate > 0.5 ? 0.002 : 0.001;
        return s + Math.round(v.views * cr) + (v.likes || 0) * 0.01 + (v.comments || 0) * 0.05;
      }, 0);

      let cumSubs = Math.max(0, subscriberCount - Math.round(totalEstSubsGained));

      rangeVideos.forEach((v: any) => {
        const cr = v.engagementRate > 5 ? 0.008 : v.engagementRate > 2 ? 0.004 : v.engagementRate > 0.5 ? 0.002 : 0.001;
        const gained = Math.round(v.views * cr) + Math.round((v.likes || 0) * 0.01) + Math.round((v.comments || 0) * 0.05);
        cumSubs = Math.min(subscriberCount, cumSubs + gained);
        rangeViews += v.views;
        rangeLikes += v.likes || 0;
        rangeWatchTime += Math.round(v.views * (v.duration || 180) / 60);

        viewsGrowthData.push({ date: new Date(v.publishedAt).toISOString(), views: v.views });
        subscriberGrowthData.push({ date: new Date(v.publishedAt).toISOString(), count: cumSubs, gained });
      });

      totalWatchTime = rangeWatchTime;
      totalLikes = rangeLikes;
    } else {
      // No videos in this range — show message
      viewsGrowthData.push({ date: now.toISOString(), views: 0 });
      subscriberGrowthData.push({ date: now.toISOString(), count: subscriberCount, gained: 0 });
    }

    return {
      channelTitle,
      subscriberCount,
      totalWatchTime: Math.round(totalWatchTime),
      totalLikes: Math.round(totalLikes),
      videos: rangeVideos.length > 0 ? rangeVideos : videos,
      subscriberGrowthData,
      viewsGrowthData,
      range,
      videosInRange: rangeVideos.length,
    };
  } catch (err) {
    console.error('Public fetch error:', err);
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
    const range = body.range || 'month';
    if (!channelUrl) return NextResponse.json({ error: 'channelUrl required' }, { status: 400 });
    await connectDB();
    // NEW: Check for connected YouTube account first
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findById(access.userId).lean() as any;
    
    if (userDoc?.youtube?.refresh_token) {
      try {
        const { getRealYouTubeData } = await import('@/services/youtubeAnalytics');
        const realData = await getRealYouTubeData({
          access_token: userDoc.youtube.access_token,
          refresh_token: userDoc.youtube.refresh_token,
          expiry_date: userDoc.youtube.expiry_date
        }, range);

        // Update DB cache
        const aiInsights = generateYouTubeInsights(realData.videos);
        await YoutubeGrowth.findOneAndUpdate(
          { userId: access.userId, channelUrl },
          {
            userId: access.userId,
            channelUrl,
            ...realData,
            totalWatchTime: realData.totalWatchTime,
            totalLikes: realData.totalLikes,
            aiInsights,
            lastFetchedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        return NextResponse.json({
          ...realData,
          aiInsights,
          isConnected: true,
          message: 'Real-time data fetched from YouTube Studio.'
        });
      } catch (err: any) {
        console.error('Real YouTube data fetch failed:', err);
        // Fallback to public Data API if OAuth fails (e.g. revoked)
      }
    }

    const config = await getApiConfig();
    const apiKey = config.youtubeDataApiKey?.trim();
    const channelId = extractChannelIdFromUrl(channelUrl);

    if (apiKey) {
      const real = await fetchChannelDataFromYouTube(channelUrl, apiKey, range);
      if (real) {
        const videos = real.videos;
        const subscriberGrowthData = real.subscriberGrowthData.map((d: any) => ({ date: new Date(d.date).toISOString(), count: d.count }));
        const viewsGrowthData = real.viewsGrowthData.map((d: any) => ({ date: new Date(d.date).toISOString(), views: d.views }));
        const aiInsights = generateYouTubeInsights(videos);

        await YoutubeGrowth.findOneAndUpdate(
          { userId: access.userId, channelUrl },
          {
            userId: access.userId,
            channelUrl,
            channelId: channelId || 'mock',
            channelTitle: real.channelTitle,
            subscriberCount: real.subscriberCount,
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
          channelTitle: real.channelTitle,
          subscriberCount: real.subscriberCount,
          totalWatchTime: real.totalWatchTime,
          totalLikes: real.totalLikes,
          videos,
          subscriberGrowthData,
          viewsGrowthData,
          aiInsights,
          isConnected: false,
          needsAuth: true,
          message: 'Public data fetched correctly, but connect YouTube for private Studio metrics.'
        });
      }
    }

    return NextResponse.json({ 
      error: 'Please connect your YouTube account to see real analytics.',
      needsAuth: true 
    }, { status: 403 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
