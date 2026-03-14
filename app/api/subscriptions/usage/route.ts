import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's plan limits
    const plan = user.subscription || 'free';
    const limits = {
      free: { videos: 5, storage: 100 },
      pro: { videos: Infinity, storage: 10240 },
      enterprise: { videos: Infinity, storage: 102400 },
    };

    const userLimits = limits[plan as keyof typeof limits] || limits.free;

    // Count videos analyzed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const videosAnalyzed = await Video.countDocuments({
      userId: user.id,
      uploadedAt: { $gte: startOfMonth },
    });

    const analysesThisMonth = await Analysis.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Calculate storage used (simplified - would need actual file sizes)
    const videos = await Video.find({ userId: user.id });
    const storageUsed = videos.length * 10; // Estimate 10MB per video

    return NextResponse.json({
      videosAnalyzed,
      videosLimit: userLimits.videos === Infinity ? 'Unlimited' : userLimits.videos,
      storageUsed: Math.round(storageUsed),
      storageLimit: userLimits.storage === Infinity ? 'Unlimited' : `${userLimits.storage} MB`,
      analysesThisMonth,
    });
  } catch (error: any) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
