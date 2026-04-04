
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAdvancedChannelAnalytics } from '@/services/youtube/advancedChannelAnalytics';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 });
    }

    // 1. Get Advanced Analytics
    const analytics = await getAdvancedChannelAnalytics(url);

    // 2. Save a "representative" Video & Analysis record for usage tracking & dashboard
    // This allows the action to show up in the user's history and metrics.
    try {
      await connectDB();
      const video = new Video({
        userId: authUser.id,
        title: `Channel Audit: ${analytics.channelInfo.title}`,
        description: `Advanced analysis for YouTube channel ${analytics.channelInfo.customUrl || analytics.channelInfo.title}.`,
        videoUrl: `https://youtube.com/channel/${analytics.channelInfo.id}`,
        thumbnailUrl: analytics.channelInfo.thumbnails?.high?.url || analytics.channelInfo.thumbnails?.default?.url,
        platform: 'youtube',
        youtubeId: analytics.channelInfo.id,
        duration: 0,
        hashtags: ['channelAudit', 'analytics'],
        uploadedAt: new Date(),
      });
      await video.save();

      const analysis = new Analysis({
        videoId: video._id,
        viralProbability: analytics.recentVideos[0]?.viralScore || 70,
        hookScore: analytics.videoPerformance.averageEngagementRate * 10,
        thumbnailScore: 85,
        titleScore: 85,
        confidenceLevel: 90,
        titleAnalysis: {
          optimizedTitles: analytics.recentVideos.slice(0, 3).map(v => v.title),
          keywords: ['audit', 'growth', 'youtube'],
        },
      });
      await analysis.save();

      video.analysisId = analysis._id;
      await video.save();

      // Update manual usageStats counters
      const user = await User.findById(authUser.id);
      if (user) {
        if (!user.usageStats) user.usageStats = { videosAnalyzed: 0, analysesThisMonth: 0, competitorsTracked: 0, hashtagsGenerated: 0 };
        user.usageStats.analysesThisMonth = (user.usageStats.analysesThisMonth || 0) + 1;
        user.usageStats.videosAnalyzed = (user.usageStats.videosAnalyzed || 0) + 1;
        await user.save();
      }
    } catch (dbError) {
      console.error('Channel Analytics DB Save Error (Non-critical):', dbError);
    }

    return NextResponse.json({
      success: true,
      analytics
    });
  } catch (error: any) {
    console.error('Advanced Channel Analytics Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze channel' },
      { status: 500 }
    );
  }
}
