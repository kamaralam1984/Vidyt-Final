export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { checkLimit, getLimitExceededResponse } from '@/lib/limitChecker';
import { getTitleSuggestionsCount, getHashtagCount } from '@/lib/planLimits';
import { analyzeVideoHook } from '@/services/hookAnalyzer';
import { analyzeThumbnail } from '@/services/thumbnailAnalyzer';
import { analyzeTitle } from '@/services/titleOptimizer';
import { predictViralPotential } from '@/services/viralPredictor';
import { getTrendingScore } from '@/services/trendingEngine';
import { generateHashtags } from '@/services/hashtagGenerator';
import { predictBestPostingTime } from '@/services/postingTimePredictor';
import Analysis from '@/models/Analysis';
import { withUploadRateLimit } from '@/middleware/rateLimitMiddleware';
import {
  buildUploadSeoPack,
  commaSeparatedYoutubeTags,
  modeledHookStrengthForTitleSeo,
  modeledViralFitForTitleSeo,
  takeFiveTitles,
} from '@/lib/buildUploadSeo';

async function handleUpload(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await getUserFromRequest(request);
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const userId = authUser?.id ?? (formData.get('userId') as string) ?? 'default-user';

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Reject files exceeding 500 MB before buffering
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(0)} MB). Maximum allowed size is 500 MB.` },
        { status: 413 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const planId = user.subscription || 'free';

    const titleSuggestionsLimit = getTitleSuggestionsCount(planId);
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    
    // ── STEP 1: Basic Metadata Extraction (Fast) ──────────────────────────
    // In a real app, we'd use FFmpeg here to get duration/metadata.
    // For now, we'll use sensible defaults for Fast Init.
    const duration = 60; 
    const thumbnailUrl = '/placeholder-thumbnail.jpg';

    // ── STEP 2: Save Video Record (Fast) ──────────────────────────────────
    const video = new Video({
      userId,
      title,
      description,
      videoUrl: `/uploads/${file.name}`, // Simulated path
      thumbnailUrl,
      platform: 'upload',
      duration,
      hashtags: [],
    });
    await video.save();

    // ── STEP 3: Create Blank Analysis Record (Fast) ───────────────────────
    const analysisPriority = (planId === 'pro' || planId === 'enterprise') ? 'high' : 'normal';
    const analysis = new Analysis({
      videoId: video._id,
      hookScore: 0,
      thumbnailScore: 0,
      titleScore: 0,
      viralProbability: 0,
      confidenceLevel: 0,
      hookAnalysis: { facesDetected: 0, motionIntensity: 0, sceneChanges: 0, brightness: 0 },
      thumbnailAnalysis: { facesDetected: 0, emotion: 'neutral', colorContrast: 0, textReadability: 0, suggestions: [] },
      titleAnalysis: { keywords: [], emotionalTriggers: [], length: title.length, clickPotential: 0, optimizedTitles: [] },
      hashtags: [],
      trendingTopics: [],
      bestPostingTime: { day: 'Pending', hour: 0, confidence: 0 },
      priority: analysisPriority,
    });
    await analysis.save();

    video.analysisId = analysis._id;
    await video.save();
    
    // Update usage
    try {
      if (!user.usageStats) user.usageStats = { videosAnalyzed: 0, analysesThisMonth: 0, competitorsTracked: 0, hashtagsGenerated: 0 };
      user.usageStats.analysesThisMonth = (user.usageStats.analysesThisMonth || 0) + 1;
      user.usageStats.videosAnalyzed = (user.usageStats.videosAnalyzed || 0) + 1;
      await user.save();
    } catch(e) {}

    
    return NextResponse.json({
      success: true,
      video: {
        id: video._id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
      },
      analysisId: analysis._id,
      // Metadata for immediate display
      metadata: {
        title: video.title,
        duration: video.duration,
        platform: video.platform
      }
    });
  } catch (error: any) {
    console.error('Error uploading video:', error);
    // Log more details if it's a specific error
    const detailedError = error instanceof Error ? error.message : String(error);
    console.error('Detailed error info:', detailedError);
    
    return NextResponse.json(
      { 
        error: 'Failed to upload and analyze video',
        details: detailedError
      },
      { status: 500 }
    );
  }
}

import { withUsageLimit } from '@/middleware/usageGuard';

// Wrap with rate limiting (20 uploads per hour) AND plan-based usage limits
export const POST = withUploadRateLimit(
  withUsageLimit((req) => handleUpload(req), 'video_upload'),
  { endpoint: '/api/videos/upload' }
);
