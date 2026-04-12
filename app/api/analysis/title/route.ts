export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import { getUserFromRequest } from '@/lib/auth';
import { analyzeTitle } from '@/services/titleOptimizer';
import { getTitleSuggestionsCount } from '@/lib/planLimits';
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
    if (!video || !analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (analysis.titleScore > 0) {
      return NextResponse.json({ success: true, analysis: analysis.titleAnalysis, score: analysis.titleScore });
    }

    const user = await User.findById(authUser.id);
    const limit = getTitleSuggestionsCount(user?.subscription || 'free');

    let titleAnalysis;
    try {
      titleAnalysis = analyzeTitle(video.title, { maxSuggestions: limit });
    } catch {
      titleAnalysis = { keywords: [], emotionalTriggers: [], length: video.title.length, clickPotential: 50, optimizedTitles: [], score: 50 };
    }

    analysis.titleAnalysis = titleAnalysis;
    analysis.titleScore = titleAnalysis.score;
    await analysis.save();

    return NextResponse.json({
        success: true,
        analysis: analysis.titleAnalysis,
        score: analysis.titleScore
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
