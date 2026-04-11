export const dynamic = "force-dynamic";
export const maxDuration = 10; // Keep this fast!

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { checkAnalysisLimit } from '@/lib/usageCheck';
import { extractYouTubeMetadata } from '@/services/youtube';
import Analysis from '@/models/Analysis';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getUserFromRequest(request);

    const body = await request.json();
    const { youtubeUrl } = body;

    console.log('API: Processing YouTube video (FAST INIT). Input URL:', youtubeUrl);

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    const user = authUser ? await User.findById(authUser.id) : null;
    if (!user) {
       return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const planId = user.role === 'super-admin' ? 'owner' : (user.subscription || 'free');
    const limitCheck = await checkAnalysisLimit(String(user._id), planId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: limitCheck.message || 'Video analysis limit reached. Please upgrade your plan.',
          message: limitCheck.message || 'Video analysis limit reached. Please upgrade your plan.',
          used: limitCheck.used,
          limit: limitCheck.limit,
          period: limitCheck.period,
        },
        { status: 403 }
      );
    }
    
    const finalUserId = String(user._id);

    // ── Step 1: Extract basic metadata ────────────
    let metadata;
    try {
      metadata = await extractYouTubeMetadata(youtubeUrl);
    } catch (metadataError: any) {
      return NextResponse.json(
        { error: metadataError.message || 'Failed to extract YouTube video metadata' },
        { status: 400 }
      );
    }

    // ── Step 2: Extract video ID ────────────
    const videoIdMatch =
      youtubeUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
      youtubeUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
      youtubeUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/) ||
      youtubeUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    const youtubeId = videoIdMatch ? videoIdMatch[1] : null;

    // ── Step 3: Save initial video to DB ────────────
    let video;
    try {
      video = new Video({
        userId: finalUserId,
        title: metadata.title,
        description: metadata.description,
        videoUrl: youtubeUrl,
        thumbnailUrl: metadata.thumbnailUrl,
        platform: 'youtube',
        youtubeId,
        duration: metadata.duration,
        views: metadata.views,
        hashtags: metadata.hashtags,
      });
      await video.save();
    } catch (error: any) {
      throw new Error(`Failed to save video to database: ${error.message}`);
    }

    // ── Step 4: Create blank analysis record ────────────
    let analysis;
    try {
      analysis = new Analysis({
        videoId: video._id,
        // All default empty values to be filled lazily:
        hookScore: 0,
        thumbnailScore: 0,
        titleScore: 0,
        viralProbability: 0,
        confidenceLevel: 0,
        hookAnalysis: { facesDetected: 0, motionIntensity: 0, sceneChanges: 0, brightness: 0 },
        thumbnailAnalysis: { facesDetected: 0, emotion: 'neutral', colorContrast: 0, textReadability: 0, suggestions: [] },
        titleAnalysis: { keywords: [], emotionalTriggers: [], length: 0, clickPotential: 0, optimizedTitles: [] },
        hashtags: metadata.hashtags,
        trendingTopics: [],
        bestPostingTime: { day: 'Pending', hour: 0, confidence: 0 },
        priority: authUser?.subscription === 'pro' || authUser?.subscription === 'enterprise' ? 'high' : 'normal',
      });
      await analysis.save();
    } catch (error: any) {
      try {
        await Video.findByIdAndDelete(video._id);
      } catch {}
      throw new Error(`Failed to save analysis to database: ${error.message}`);
    }

    video.analysisId = analysis._id;
    await video.save();

    // Keep lifetime counters in sync (limit enforcement uses DB period count).
    try {
      if (!user.usageStats) user.usageStats = { videosAnalyzed: 0, analysesThisMonth: 0, competitorsTracked: 0, hashtagsGenerated: 0 };
      user.usageStats.videosAnalyzed = (user.usageStats.videosAnalyzed || 0) + 1;
      await user.save();
    } catch {}

    // Return immediately! FAST API! < 2 seconds
    return NextResponse.json({
      success: true,
      video: {
        id: video._id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        youtubeId: video.youtubeId,
        duration: video.duration,
        description: video.description
      },
      analysisId: analysis._id
    });
  } catch (error: any) {
    console.error('Error processing YouTube video init:', error);
    const errorMessage = error?.message || 'Unknown error occurred';
    let userFriendlyMessage = 'Failed to process YouTube video';
    if (errorMessage.includes('Database') || errorMessage.includes('MongoDB')) {
      userFriendlyMessage = 'Database connection failed. Please ensure MongoDB is running.';
    } else if (errorMessage.includes('YouTube') || errorMessage.includes('metadata')) {
      userFriendlyMessage = errorMessage;
    }
    return NextResponse.json({ error: userFriendlyMessage }, { status: 500 });
  }
}
