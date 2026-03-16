import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import { getUserFromRequest } from '@/lib/auth';
import { checkAnalysisLimit } from '@/lib/usageCheck';
import { getTitleSuggestionsCount, getHashtagCount } from '@/lib/planLimits';
import { extractInstagramMetadata } from '@/services/instagram';
import { analyzeThumbnail } from '@/services/thumbnailAnalyzer';
import { analyzeThumbnailReal } from '@/services/ai/thumbnailAnalysis';
import { analyzeVideoHookReal } from '@/services/ai/videoAnalysis';
import { analyzeTitle } from '@/services/titleOptimizer';
import { predictViralPotential } from '@/services/viralPredictor';
import { predictViralPotential as advancedPredict } from '@/services/ai/viralPredictor';
import { getTrendingScore } from '@/services/trendingEngine';
import { generateHashtags } from '@/services/hashtagGenerator';
import { predictBestPostingTime } from '@/services/postingTimePredictor';
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
    
    // Get authenticated user (required - middleware already validated token)
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Your session has expired. Please login again.'
        },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { instagramUrl, userId } = body;
    
    if (!instagramUrl) {
      return NextResponse.json({ error: 'Instagram URL is required' }, { status: 400 });
    }

    const planId = authUser.role === 'super-admin' ? 'owner' : (authUser.subscription || 'free');
    const limitResult = await checkAnalysisLimit(authUser.id, planId);
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Usage limit reached',
          message: limitResult.message,
          used: limitResult.used,
          limit: limitResult.limit,
          period: limitResult.period,
        },
        { status: 403 }
      );
    }

    // Extract metadata from Instagram
    let metadata;
    try {
      console.log('Starting Instagram metadata extraction for URL:', instagramUrl);
      metadata = await extractInstagramMetadata(instagramUrl);
      console.log('Successfully extracted metadata:', { title: metadata.title, duration: metadata.duration });
    } catch (metadataError: any) {
      console.error('Instagram metadata extraction error:', metadataError);
      return NextResponse.json(
        { 
          error: metadataError.message || 'Failed to extract Instagram video metadata',
          details: process.env.NODE_ENV === 'development' ? metadataError.message : undefined
        },
        { status: 400 }
      );
    }
    
    // Extract shortcode
    const shortcodeMatch = instagramUrl.match(/instagram\.com\/(?:p|reel|tv|reels)\/([a-zA-Z0-9_-]+)/);
    const instagramShortcode = shortcodeMatch ? shortcodeMatch[1] : null;
    
    // Analyze thumbnail with real computer vision
    let thumbnailAnalysis;
    try {
      thumbnailAnalysis = await analyzeThumbnailReal(metadata.thumbnailUrl);
    } catch (error: any) {
      console.error('Real thumbnail analysis error, trying fallback:', error);
      try {
        thumbnailAnalysis = await analyzeThumbnail(metadata.thumbnailUrl);
      } catch (fallbackError: any) {
        console.error('Fallback thumbnail analysis error:', fallbackError);
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
      trendingScore = await getTrendingScore(titleAnalysis.keywords);
    } catch (error: any) {
      console.error('Trending score error:', error);
    }
    
    // Analyze video hook with real computer vision
    let hookAnalysis;
    try {
      hookAnalysis = await analyzeVideoHookReal(
        instagramUrl, // Use original URL since metadata doesn't have videoUrl
        metadata.thumbnailUrl
      );
    } catch (error: any) {
      console.error('Video hook analysis error:', error);
      hookAnalysis = {
        facesDetected: 0,
        motionIntensity: 50,
        sceneChanges: 0,
        brightness: 50,
        score: 50,
      };
    }
    
    // Predict best posting time
    let bestPostingTime;
    try {
      bestPostingTime = predictBestPostingTime();
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
        hashtags: [],
        platform: 'instagram',
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
    
    // Generate hashtags
    let hashtags: string[] = [];
    try {
      hashtags = await generateHashtags(titleAnalysis, metadata.description, metadata.hashtags, getHashtagCount(planId));
    } catch (error: any) {
      console.error('Hashtag generation error:', error);
      hashtags = metadata.hashtags.map(tag => `#${tag}`);
    }
    
    // Get trending topics
    let trendingTopics: Array<{ keyword: string; score: number }> = [];
    try {
      const { getTrendingTopics } = await import('@/services/trendingEngine');
      trendingTopics = await getTrendingTopics(titleAnalysis.keywords);
    } catch (error: any) {
      console.error('Trending topics error:', error);
    }
    
    // Predict best posting time
    let postingTime;
    try {
      postingTime = await predictBestPostingTime();
    } catch (error: any) {
      console.error('Posting time prediction error:', error);
      postingTime = {
        bestDay: 'Monday',
        bestTime: '10:00 AM',
        heatmap: [],
      };
    }
    
    // Save video to database
    const video = new Video({
      userId: authUser.id,
      title: metadata.title,
      description: metadata.description,
      videoUrl: instagramUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      platform: 'instagram',
      instagramShortcode,
      duration: metadata.duration,
      views: metadata.views,
      hashtags: metadata.hashtags,
    });
    
    await video.save();
    
    // Create analysis
    const analysis = new Analysis({
      videoId: video._id,
      hookScore: hookAnalysis.score,
      thumbnailScore: thumbnailAnalysis.score,
      titleScore: titleAnalysis.score,
      viralProbability: viralPrediction.viralProbability,
      confidenceLevel: viralPrediction.confidenceLevel,
      hookAnalysis,
      thumbnailAnalysis,
      titleAnalysis,
      trendingScore,
      hashtags,
      trendingTopics,
        postingTime: bestPostingTime,
    });
    
    await analysis.save();
    
    // Update video with analysis ID
    video.analysisId = analysis._id;
    await video.save();
    
    return NextResponse.json({
      success: true,
      video: {
        id: video._id,
        title: video.title,
        platform: video.platform,
        instagramShortcode: video.instagramShortcode,
      },
      analysis: {
        hookScore: analysis.hookScore,
        thumbnailScore: analysis.thumbnailScore,
        titleScore: analysis.titleScore,
        viralProbability: analysis.viralProbability,
        confidenceLevel: analysis.confidenceLevel,
        hookAnalysis: analysis.hookAnalysis,
        thumbnailAnalysis: analysis.thumbnailAnalysis,
        titleAnalysis: analysis.titleAnalysis,
        trendingScore: analysis.trendingScore,
        hashtags: analysis.hashtags,
        trendingTopics: analysis.trendingTopics,
        postingTime: analysis.postingTime,
      },
    });
  } catch (error: any) {
    console.error('Instagram video analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze Instagram video',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
