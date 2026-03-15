import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import { getPlanRoll } from '@/lib/planLimits';
import { getAnalysisUsageCount } from '@/lib/usageCheck';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const planId = user.subscription || 'free';
    const plan = getPlanRoll(planId);
    const { analysesLimit, analysesPeriod } = plan.limits;
    const videosAnalyzed = await getAnalysisUsageCount(user.id, analysesPeriod);

    const videos = await Video.find({ userId: user.id });
    const storageUsed = videos.length * 10; // Estimate 10MB per video

    const videosLimitLabel =
      analysesPeriod === 'day'
        ? `${analysesLimit}/day`
        : `${analysesLimit}/month`;

    return NextResponse.json({
      videosAnalyzed,
      videosLimit: analysesLimit,
      videosLimitLabel,
      period: analysesPeriod,
      storageUsed: Math.round(storageUsed),
      storageLimit: null,
      analysesThisMonth: videosAnalyzed,
    });
  } catch (error: any) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
