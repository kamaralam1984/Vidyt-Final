export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { checkLimit, getLimitExceededResponse } from '@/lib/limitChecker';
import { getTitleSuggestionsCount, getHashtagCount } from '@/lib/planLimits';
import { extractYouTubeMetadata } from '@/services/youtube';
import { analyzeThumbnail } from '@/services/thumbnailAnalyzer';
import { analyzeThumbnailReal } from '@/services/ai/thumbnailAnalysis';
import { analyzeTitle } from '@/services/titleOptimizer';
import { predictViralPotential } from '@/services/viralPredictor';
import { predictViralPotential as advancedPredict } from '@/services/ai/viralPredictor';
import { analyzeVideoHookReal } from '@/services/ai/videoAnalysis';
import { getTrendingScore } from '@/services/trendingEngine';
import { generateHashtags } from '@/services/hashtagGenerator';
import { predictBestPostingTime } from '@/services/postingTimePredictor';
import { triggerWebhooks } from '@/services/webhooks';
import Analysis from '@/models/Analysis';

export async function POST(request: NextRequest) {
  try {
    // Connect to database first
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }
    
    const authUser = await getUserFromRequest(request);
    
    // TEMPORARY BYPASS FOR DEBUGGING
    /*
    if (!authUser) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Your session has expired. Please login again.'
        },
        { status: 401 }
      );
    }
    */
    
    const body = await request.json();
    const { youtubeUrl, userId } = body;

    console.log('API: Processing YouTube video. Input URL:', youtubeUrl);

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    // TEMPORARY BYPASS
    // const user = await User.findById(authUser.id);
    let user = authUser ? await User.findById(authUser.id) : null;
    if (!user) {
      console.log('User not found, using dummy user for test');
      user = { _id: 'dummy', subscription: 'free' } as any;
    }
    
    if (!checkLimit(user, 'analyses')) {
      return NextResponse.json(getLimitExceededResponse(), { status: 403 });
    }
    const planId = user.subscription || 'free';

    // Use authenticated user ID (required)
    const finalUserId = authUser?.id || 'dummy';
    
    // Extract metadata from YouTube
    let metadata;
    try {
      console.log('Starting YouTube metadata extraction for URL:', youtubeUrl);
      metadata = await extractYouTubeMetadata(youtubeUrl);
      console.log('Successfully extracted metadata:', { title: metadata.title, duration: metadata.duration });
    } catch (metadataError: any) {
      console.error('YouTube metadata extraction error:', metadataError);
      console.error('Error stack:', metadataError?.stack);
      console.error('Error details:', {
        message: metadataError?.message,
        name: metadataError?.name,
        code: metadataError?.code,
      });
      return NextResponse.json(
        { 
          error: metadataError.message || 'Failed to extract YouTube video metadata',
          details: process.env.NODE_ENV === 'development' ? metadataError.message : undefined,
          stack: process.env.NODE_ENV === 'development' ? metadataError?.stack : undefined
        },
        { status: 400 }
      );
    }
    
    // Extract video ID (for database storage)
    const videoIdMatch = youtubeUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || 
                         youtubeUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
                         youtubeUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/) ||
                         youtubeUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    const youtubeId = videoIdMatch ? videoIdMatch[1] : null;
    console.log('API: Resolved YouTube ID for database:', youtubeId);
    
    // Analyze thumbnail with real computer vision
    let thumbnailAnalysis;
    try {
      // Try real analysis first, fallback to basic if it fails
      thumbnailAnalysis = await analyzeThumbnailReal(metadata.thumbnailUrl, 'youtube');
    } catch (error: any) {
      console.error('Real thumbnail analysis error, trying fallback:', error);
      try {
        thumbnailAnalysis = await analyzeThumbnail(metadata.thumbnailUrl);
      } catch (fallbackError: any) {
        console.error('Fallback thumbnail analysis error:', fallbackError);
        // Use default thumbnail analysis if both fail
        thumbnailAnalysis = {
          facesDetected: 0,
          colorContrast: 50,
          textReadability: 50,
          suggestions: ['Thumbnail analysis unavailable'],
          score: 50,
        };
      }
    }
    
    const titleSuggestionsLimit = getTitleSuggestionsCount(planId);
    let titleAnalysis;
    try {
      titleAnalysis = analyzeTitle(metadata.title, { maxSuggestions: titleSuggestionsLimit });
    } catch (error: any) {
      console.error('Title analysis error:', error);
      // Use default title analysis if it fails
      titleAnalysis = {
        keywords: [],
        emotionalTriggers: [],
        length: metadata.title.length,
        clickPotential: 50,
        optimizedTitles: [metadata.title],
        score: 50,
      };
    }
    
    // Get trending score
    let trendingScore = 50;
    try {
      trendingScore = await getTrendingScore(titleAnalysis.keywords, 'youtube');
    } catch (error: any) {
      console.error('Trending score error:', error);
    }
    
    // Analyze video hook with real computer vision
    // For YouTube videos, we analyze thumbnail as proxy for hook
    let hookAnalysis;
    try {
      hookAnalysis = await analyzeVideoHookReal(
        youtubeUrl, // Use original URL since metadata doesn't have videoUrl
        metadata.thumbnailUrl,
        undefined,
        'youtube',
        metadata.duration
      );
    } catch (error: any) {
      console.error('Video hook analysis error:', error);
      // Use default hook analysis if it fails
      hookAnalysis = {
        facesDetected: 0,
        motionIntensity: 50,
        sceneChanges: 0,
        brightness: 50,
        score: 50,
      };
    }
    
    // Generate hashtags
    let hashtags: string[] = [];
    try {
      hashtags = await generateHashtags(titleAnalysis, metadata.description, metadata.hashtags, getHashtagCount(planId));
    } catch (error: any) {
      console.error('Hashtag generation error:', error);
      hashtags = metadata.hashtags.map(tag => `#${tag}`);
    }
    
    // Predict best posting time
    let bestPostingTime;
    try {
      bestPostingTime = predictBestPostingTime(undefined, 'youtube');
    } catch (error: any) {
      console.error('Posting time prediction error:', error);
      bestPostingTime = {
        day: 'Tuesday',
        hour: 14,
        confidence: 50,
      };
    }
    
    // Predict viral potential using advanced AI model
    let viralPrediction;
    try {
      // Use advanced prediction with TensorFlow model
      viralPrediction = await advancedPredict({
        hookScore: hookAnalysis.score,
        thumbnailScore: thumbnailAnalysis.score,
        titleScore: titleAnalysis.score,
        trendingScore,
        videoDuration: metadata.duration,
        postingTime: bestPostingTime,
        hashtags: hashtags.map(tag => tag.replace('#', '')),
        platform: 'youtube',
      });
      
      // Map to expected format
      viralPrediction = {
        viralProbability: viralPrediction.viralProbability,
        confidenceLevel: viralPrediction.confidence,
        predictedViews: viralPrediction.predictedViews,
        engagementForecast: viralPrediction.engagementForecast,
        growthCurve: viralPrediction.growthCurve,
        factors: viralPrediction.factors,
      };
    } catch (error: any) {
      console.error('Advanced viral prediction error, using fallback:', error);
      try {
        // Fallback to basic prediction
        viralPrediction = predictViralPotential(
          hookAnalysis,
          thumbnailAnalysis,
          titleAnalysis,
          trendingScore,
          metadata.duration
        );
      } catch (fallbackError: any) {
        console.error('Fallback viral prediction error:', fallbackError);
        viralPrediction = {
          viralProbability: 50,
          confidenceLevel: 50,
        };
      }
    }
    
    // Get trending topics
    let trendingTopics: Array<{ keyword: string; score: number }> = [];
    try {
      const { getTrendingTopics } = await import('@/services/trendingEngine');
      trendingTopics = await getTrendingTopics(titleAnalysis.keywords);
    } catch (error: any) {
      console.error('Trending topics error:', error);
    }
    
    
    // Save video to database
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
        priority: (authUser.subscription === 'pro' || authUser.subscription === 'enterprise') ? 'high' : 'normal',
      });
      
      await analysis.save();
    } catch (error: any) {
      console.error('Analysis save error:', error);
      // Try to delete the video if analysis save fails
      try {
        await Video.findByIdAndDelete(video._id);
      } catch (deleteError) {
        console.error('Failed to cleanup video:', deleteError);
      }
      throw new Error(`Failed to save analysis to database: ${error.message}`);
    }
    
    // Update video with analysis ID
    try {
      video.analysisId = analysis._id;
      await video.save();
    } catch (error: any) {
      console.error('Video update error:', error);
      // Non-critical error, continue anyway
    }

    triggerWebhooks(authUser.id, 'analysis_complete', {
      videoId: video._id.toString(),
      title: video.title,
      viralProbability: analysis.viralProbability,
      platform: 'youtube',
    }).catch(() => {});
    
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
        youtubeId: video.youtubeId,
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
    console.error('Error processing YouTube video:', error);
    console.error('Error stack:', error?.stack);
    const errorMessage = error?.message || 'Unknown error occurred';
    const errorStack = error?.stack || '';
    
    // Check for common error types
    let userFriendlyMessage = 'Failed to process YouTube video';
    if (errorMessage.includes('Database') || errorMessage.includes('MongoDB') || errorMessage.includes('connection')) {
      userFriendlyMessage = 'Database connection failed. Please ensure MongoDB is running.';
    } else if (errorMessage.includes('YouTube') || errorMessage.includes('metadata')) {
      userFriendlyMessage = errorMessage;
    }
    
    return NextResponse.json(
      { 
        error: userFriendlyMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
