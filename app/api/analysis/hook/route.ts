export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import { getUserFromRequest } from '@/lib/auth';
import { analyzeVideoHookReal } from '@/services/ai/videoAnalysis';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId, analysisId } = await request.json();
    if (!videoId || !analysisId) return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });

    const video = await Video.findOne({ _id: videoId, userId: authUser.id });
    const analysis = await Analysis.findOne({ _id: analysisId, videoId });
    if (!video || !analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (analysis.hookScore > 0) {
      return NextResponse.json({ success: true, analysis: analysis.hookAnalysis, score: analysis.hookScore });
    }

    let hookAnalysis;
    try {
      hookAnalysis = await analyzeVideoHookReal(video.videoUrl, video.thumbnailUrl, undefined, video.platform as any, video.duration);
    } catch {
      hookAnalysis = { facesDetected: 0, motionIntensity: 50, sceneChanges: 0, brightness: 50, score: 50 };
    }

    analysis.hookAnalysis = hookAnalysis;
    analysis.hookScore = hookAnalysis.score;
    await analysis.save();

    return NextResponse.json({
        success: true,
        analysis: analysis.hookAnalysis,
        score: analysis.hookScore
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
