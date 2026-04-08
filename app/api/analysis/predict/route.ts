export const dynamic = "force-dynamic";
export const maxDuration = 40; // Prediction can be heavy depending on trending queries

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import { getUserFromRequest } from '@/lib/auth';
import { predictViralPotential as advancedPredict } from '@/services/ai/viralPredictor';
import { predictViralPotential } from '@/services/viralPredictor';
import { getTrendingScore, getTrendingTopics } from '@/services/trendingEngine';
import { predictBestPostingTime } from '@/services/postingTimePredictor';
import { generateHashtags } from '@/services/hashtagGenerator';
import { getHashtagCount } from '@/lib/planLimits';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId, analysisId } = await request.json();
    if (!videoId || !analysisId) return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });

    const video = await Video.findOne({ _id: videoId, userId: authUser.id });
    const analysis = await Analysis.findOne({ _id: analysisId, videoId });
    const user = await User.findById(authUser.id);
    
    if (!video || !analysis || !user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch the ones that need keywords simultaneously
    const keywords = analysis.titleAnalysis?.keywords || [];
    const hashtagLimit = getHashtagCount(user.subscription || 'free');

    const [trendingScore, hashtags, trendingTopics, postingTime] = await Promise.all([
      getTrendingScore(keywords, video.platform as any).catch(() => 50),
      generateHashtags(analysis.titleAnalysis, video.description, video.hashtags || [], hashtagLimit).catch(() => []),
      getTrendingTopics(keywords).catch(() => []),
      Promise.resolve().then(() => { try { return predictBestPostingTime(undefined, video.platform as any); } catch { return { day: 'Wait', hour: 13, confidence: 50 }; } })
    ]);

    let viralPrediction;
    try {
      const adv = await advancedPredict({
        hookScore: analysis.hookScore || 50,
        thumbnailScore: analysis.thumbnailScore || 50,
        titleScore: analysis.titleScore || 50,
        trendingScore,
        videoDuration: video.duration,
        postingTime,
        hashtags: hashtags.map((h: string) => h.replace('#', '')),
        platform: video.platform as any
      });
      viralPrediction = {
         viralProbability: adv.viralProbability,
         confidenceLevel: adv.confidence,
      }
    } catch {
       try {
         viralPrediction = predictViralPotential(analysis.hookAnalysis, analysis.thumbnailAnalysis, analysis.titleAnalysis, trendingScore, video.duration);
       } catch {
         viralPrediction = { viralProbability: 50, confidenceLevel: 50 };
       }
    }

    analysis.hashtags = hashtags.map((h: string) => h.replace('#', ''));
    analysis.trendingTopics = trendingTopics;
    analysis.bestPostingTime = postingTime;
    analysis.viralProbability = viralPrediction.viralProbability;
    analysis.confidenceLevel = viralPrediction.confidenceLevel;

    await analysis.save();

    return NextResponse.json({
        success: true,
        viralProbability: analysis.viralProbability,
        confidenceLevel: analysis.confidenceLevel,
        hashtags: analysis.hashtags,
        trendingTopics: analysis.trendingTopics,
        bestPostingTime: analysis.bestPostingTime,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
