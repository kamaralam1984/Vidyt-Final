export const dynamic = "force-dynamic";

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

export async function POST(request: NextRequest) {
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!checkLimit(user, 'analyses')) {
      return NextResponse.json(getLimitExceededResponse(), { status: 403 });
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
    
    // Predict best posting time
    const bestPostingTime = predictBestPostingTime();
    
    // Save video to database
    const video = new Video({
      userId,
      title,
      description,
      videoUrl: `/uploads/${file.name}`, // In production, upload to cloud storage
      thumbnailUrl,
      platform: 'upload',
      duration: 60, // Would extract from video
      hashtags: hashtags.map(tag => tag.replace('#', '')),
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
        optimizedTitles: titleAnalysis.optimizedTitles,
      },
      hashtags: hashtags.map(tag => tag.replace('#', '')),
      trendingTopics: trendingTopics.map(topic => ({
        keyword: topic.keyword,
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
      analysis: {
        viralProbability: analysis.viralProbability,
        hookScore: analysis.hookScore,
        thumbnailScore: analysis.thumbnailScore,
        titleScore: analysis.titleScore,
        confidenceLevel: analysis.confidenceLevel,
      },
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload and analyze video' },
      { status: 500 }
    );
  }
}
