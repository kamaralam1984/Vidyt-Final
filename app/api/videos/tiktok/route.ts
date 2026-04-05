export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { checkLimit, getLimitExceededResponse } from '@/lib/limitChecker';
import { getTitleSuggestionsCount, getHashtagCount } from '@/lib/planLimits';
import { extractTikTokMetadata } from '@/services/tiktok';
import { analyzeThumbnail } from '@/services/thumbnailAnalyzer';
import { analyzeTitle } from '@/services/titleOptimizer';
import { predictViralPotential } from '@/services/ai/viralPredictor';
import { getTrendingScore, getTrendingTopics } from '@/services/trendingEngine';
import { generateHashtags } from '@/services/hashtagGenerator';
import { predictBestPostingTime } from '@/services/postingTimePredictor';
import Analysis from '@/models/Analysis';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get authenticated user
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to analyze videos.' },
        { status: 401 }
      );
    }

    // Check subscription limits
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!checkLimit(user, 'analyses')) {
      return NextResponse.json(getLimitExceededResponse(), { status: 403 });
    }
    const planId = user.subscription || 'free';

    const body = await request.json();
    const { tiktokUrl } = body;

    if (!tiktokUrl) {
      return NextResponse.json({ error: 'TikTok URL is required' }, { status: 400 });
    }

    // Extract metadata
    let metadata;
    try {
      console.log('Starting TikTok metadata extraction for URL:', tiktokUrl);
      metadata = await extractTikTokMetadata(tiktokUrl);
      console.log('Successfully extracted metadata:', { title: metadata.title });
    } catch (metadataError: any) {
      console.error('TikTok metadata extraction error:', metadataError);
      return NextResponse.json(
        {
          error: metadataError.message || 'Failed to extract TikTok video metadata',
          details: process.env.NODE_ENV === 'development' ? metadataError.message : undefined,
        },
        { status: 400 }
      );
    }

    // Extract TikTok video ID
    const tiktokId = tiktokUrl.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)?.[1] || 
                     tiktokUrl.match(/vm\.tiktok\.com\/(\w+)/)?.[1] ||
                     tiktokUrl.match(/tiktok\.com\/t\/(ZTd\w+)/)?.[1] || null;

    const titleSuggestionsLimit = getTitleSuggestionsCount(planId);
    const hookAnalysis = { facesDetected: 0, motionIntensity: 50, sceneChanges: 0, brightness: 50, score: 50 };
    const thumbnailAnalysis = await analyzeThumbnail(metadata.thumbnailUrl);
    const titleAnalysis = analyzeTitle(metadata.title, { maxSuggestions: titleSuggestionsLimit });
    const trendingScore = await getTrendingScore(titleAnalysis.keywords);
    const viralPrediction = await predictViralPotential({
      hookScore: hookAnalysis.score,
      thumbnailScore: thumbnailAnalysis.score,
      titleScore: titleAnalysis.score,
      trendingScore,
      videoDuration: metadata.duration,
      platform: 'tiktok',
      // Real-world features from yt-dlp
      views: metadata.views,
      likes: metadata.likes,
      comments: metadata.comments,
      shares: metadata.shares,
      hashtags: metadata.hashtags,
      author: metadata.author
    });
    
    const hashtags = await generateHashtags(titleAnalysis, metadata.description, metadata.hashtags, getHashtagCount(planId));
    const trendingTopics = await getTrendingTopics(titleAnalysis.keywords, 'tiktok');
    const bestPostingTime = predictBestPostingTime(undefined, 'tiktok');

    // Save video to database
    let video;
    try {
      video = new Video({
        userId: authUser.id,
        title: metadata.title,
        description: metadata.description,
        videoUrl: tiktokUrl,
        thumbnailUrl: metadata.thumbnailUrl,
        platform: 'tiktok',
        duration: metadata.duration,
        views: metadata.views,
        hashtags: [...metadata.hashtags, ...hashtags.map(tag => tag.replace('#', ''))],
      });
      await video.save();
    } catch (error: any) {
      console.error('Video save error:', error);
      throw new Error(`Failed to save video to database: ${error.message}`);
    }

    // Save analysis
    let analysis;
    try {
      analysis = new Analysis({
        videoId: video._id,
        hookScore: hookAnalysis.score,
        thumbnailScore: thumbnailAnalysis.score,
        titleScore: titleAnalysis.score,
        viralProbability: viralPrediction.viralProbability,
        confidenceLevel: Math.round(viralPrediction.confidence * 100),
        hookAnalysis: hookAnalysis,
        thumbnailAnalysis: thumbnailAnalysis,
        titleAnalysis: titleAnalysis,
        hashtags: hashtags.map(tag => tag.replace('#', '')),
        trendingTopics: trendingTopics.map(topic => ({ keyword: topic.topic, score: topic.score })),
        bestPostingTime: bestPostingTime,
        reasons: viralPrediction.reasons,
        weak_points: viralPrediction.weak_points,
        improvements: viralPrediction.improvements,
        platform: 'tiktok',
      });
      await analysis.save();
      video.analysisId = analysis._id;
      await video.save();
    } catch (error: any) {
      console.error('Analysis save error:', error);
      throw new Error(`Failed to save analysis to database: ${error.message}`);
    }

    // Update user usage stats
    try {
      if (!user.usageStats) {
        user.usageStats = { videosAnalyzed: 0, analysesThisMonth: 0, competitorsTracked: 0, hashtagsGenerated: 0 };
      }
      user.usageStats.analysesThisMonth = (user.usageStats.analysesThisMonth || 0) + 1;
      user.usageStats.videosAnalyzed = (user.usageStats.videosAnalyzed || 0) + 1;
      await user.save();
    } catch (error: any) {
      console.error('Usage stats update error:', error);
    }

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
        optimizedTitles: analysis.titleAnalysis.optimizedTitles,
        hashtags: analysis.hashtags,
        trendingTopics: analysis.trendingTopics,
        bestPostingTime: analysis.bestPostingTime,
      },
    });
  } catch (error: any) {
    console.error('Error processing TikTok video:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process TikTok video',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
