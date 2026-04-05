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
    
    // Analyze video hook (first 3 seconds)
    const hookAnalysis = await analyzeVideoHook(videoBuffer);
    
    // For uploaded videos, we'll need to extract thumbnail
    // For now, use a placeholder
    const thumbnailUrl = '/placeholder-thumbnail.jpg';
    const thumbnailAnalysis = await analyzeThumbnail(thumbnailUrl);
    
    const titleAnalysis = analyzeTitle(title, { maxSuggestions: titleSuggestionsLimit });
    
    // Get trending score
    const trendingScore = await getTrendingScore(titleAnalysis.keywords);
    
    // Predict viral potential
    const viralPrediction = predictViralPotential(
      hookAnalysis,
      thumbnailAnalysis,
      titleAnalysis,
      trendingScore,
      60 // Default duration, would extract from video
    );
    
    // Generate hashtags
    const hashtags = await generateHashtags(titleAnalysis, description, [], getHashtagCount(planId));
    
    // Get trending topics
    const { getTrendingTopics } = await import('@/services/trendingEngine');
    const trendingTopics = await getTrendingTopics(titleAnalysis.keywords);

    const seoViral = modeledViralFitForTitleSeo(titleAnalysis.score, trendingScore);
    const seoHook = modeledHookStrengthForTitleSeo(titleAnalysis.score);

    const seoPack = buildUploadSeoPack({
      title,
      keywords: titleAnalysis.keywords,
      hookScore: seoHook,
      viralProbability: seoViral,
      rawHashtags: hashtags.map((h) => h.replace(/^#/, '')),
      trendingTopics,
    });
    
    // Predict best posting time
    const bestPostingTime = predictBestPostingTime();
    
    // Save video to database
    const video = new Video({
      userId,
      title,
      description: seoPack.description,
      videoUrl: `/uploads/${file.name}`, // In production, upload to cloud storage
      thumbnailUrl,
      platform: 'upload',
      duration: 60, // Would extract from video
      hashtags: seoPack.hashtags,
    });
    
    await video.save();
    
    // Save analysis
    const analysisPriority = (planId === 'pro' || planId === 'enterprise') ? 'high' : 'normal';
    const analysis = new Analysis({
      videoId: video._id,
      hookScore: hookAnalysis.score,
      thumbnailScore: thumbnailAnalysis.score,
      titleScore: titleAnalysis.score,
      viralProbability: viralPrediction.viralProbability,
      confidenceLevel: viralPrediction.confidenceLevel,
      hookAnalysis: {
        facesDetected: hookAnalysis.facesDetected,
        motionIntensity: hookAnalysis.motionIntensity,
        sceneChanges: hookAnalysis.sceneChanges,
        brightness: hookAnalysis.brightness,
      },
      thumbnailAnalysis: {
        facesDetected: thumbnailAnalysis.facesDetected,
        emotion: thumbnailAnalysis.emotion,
        colorContrast: thumbnailAnalysis.colorContrast,
        textReadability: thumbnailAnalysis.textReadability,
        suggestions: thumbnailAnalysis.suggestions,
      },
      titleAnalysis: {
        keywords: titleAnalysis.keywords,
        emotionalTriggers: titleAnalysis.emotionalTriggers,
        length: titleAnalysis.length,
        clickPotential: titleAnalysis.clickPotential,
        optimizedTitles: takeFiveTitles(titleAnalysis.optimizedTitles),
      },
      hashtags: seoPack.hashtags,
      trendingTopics: seoPack.trendingTags.map((topic) => ({
        keyword: topic.topic,
        score: topic.score,
      })),
      bestPostingTime: {
        day: bestPostingTime.day,
        hour: bestPostingTime.hour,
        confidence: bestPostingTime.confidence,
      },
      priority: analysisPriority,
    });
    
    await analysis.save();
    
    // Update video with analysis ID
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
      seo: {
        description: seoPack.description,
        hashtags: seoPack.hashtags,
        trendingTags: seoPack.trendingTags,
        tags: commaSeparatedYoutubeTags(seoPack),
      },
      analysis: {
        viralProbability: analysis.viralProbability,
        hookScore: analysis.hookScore,
        thumbnailScore: analysis.thumbnailScore,
        titleScore: analysis.titleScore,
        confidenceLevel: analysis.confidenceLevel,
        optimizedTitles: takeFiveTitles(titleAnalysis.optimizedTitles),
        hashtags: seoPack.hashtags.map((h) => `#${h}`),
        trendingTopics: seoPack.trendingTags,
        seoDescription: seoPack.description,
        bestPostingTime: {
          day: bestPostingTime.day,
          hour: bestPostingTime.hour,
          confidence: bestPostingTime.confidence,
        },
      },
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
