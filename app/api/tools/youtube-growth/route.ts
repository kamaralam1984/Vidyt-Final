import { NextRequest, NextResponse } from 'next/server';
import { requireAIStudioAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import YoutubeGrowth from '@/models/YoutubeGrowth';
import { generateYouTubeInsights } from '@/services/ai/aiStudio';

function extractChannelIdFromUrl(url: string): string | null {
  const u = url.trim();
  const match = u.match(/youtube\.com\/channel\/([^/?]+)/) || u.match(/youtube\.com\/@([^/?]+)/) || u.match(/youtube\.com\/c\/([^/?]+)/);
  return match ? match[1] : null;
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
    // In production: use YouTube Data API to fetch channel + last 50 videos, views, etc.
    const channelId = extractChannelIdFromUrl(channelUrl);
    const mockVideos = Array.from({ length: 50 }, (_, i) => ({
      videoId: `mock-${i}`,
      title: `Video ${i + 1}`,
      views: 1000 + Math.floor(Math.random() * 50000),
      publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      duration: 60 + Math.floor(Math.random() * 300),
      viralScore: 40 + Math.floor(Math.random() * 50),
    }));
    const subscriberGrowthData = mockVideos.map((_, i) => ({
      date: new Date(Date.now() - (49 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      count: 1000 + i * 50 + Math.floor(Math.random() * 100),
    }));
    const viewsGrowthData = mockVideos.map((v, i) => ({
      date: v.publishedAt.toISOString().slice(0, 10),
      views: v.views,
    }));
    const aiInsights = generateYouTubeInsights(mockVideos);
    await YoutubeGrowth.findOneAndUpdate(
      { userId: access.userId, channelUrl },
      {
        userId: access.userId,
        channelUrl,
        channelId: channelId || 'mock',
        channelTitle: 'My Channel',
        subscriberCount: 5000,
        videos: mockVideos,
        subscriberGrowthData,
        viewsGrowthData,
        aiInsights,
        lastFetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({
      channelUrl,
      channelTitle: 'My Channel',
      subscriberCount: 5000,
      videos: mockVideos,
      subscriberGrowthData,
      viewsGrowthData,
      aiInsights,
      message: 'Channel data fetched (demo mode). Add YOUTUBE_API_KEY for real data.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
