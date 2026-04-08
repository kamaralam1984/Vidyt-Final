export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import { getUserFromRequest } from '@/lib/auth';
import { analyzeThumbnailReal } from '@/services/ai/thumbnailAnalysis';
import { analyzeThumbnail } from '@/services/thumbnailAnalyzer';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, analysisId } = await request.json();
    if (!videoId || !analysisId) return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });

    const video = await Video.findOne({ _id: videoId, userId: authUser.id });
    const analysis = await Analysis.findOne({ _id: analysisId, videoId });
    if (!video || !analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Ensure we don't re-run if already populated (optional safety, but good to have)
    if (analysis.thumbnailScore > 0) {
       return NextResponse.json({ success: true, analysis: analysis.thumbnailAnalysis, score: analysis.thumbnailScore });
    }

    let thumbnailAnalysis;
    try {
      thumbnailAnalysis = await analyzeThumbnailReal(video.thumbnailUrl, video.platform as any);
    } catch (e) {
      try {
         thumbnailAnalysis = await analyzeThumbnail(video.thumbnailUrl);
      } catch {
         thumbnailAnalysis = { facesDetected: 0, colorContrast: 50, textReadability: 50, suggestions: [], score: 50 };
      }
    }

    analysis.thumbnailAnalysis = thumbnailAnalysis;
    analysis.thumbnailScore = thumbnailAnalysis.score;
    // Do not trigger full save hooks if this is partial, but here we just save
    await analysis.save();

    return NextResponse.json({
        success: true,
        analysis: analysis.thumbnailAnalysis,
        score: analysis.thumbnailScore
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
