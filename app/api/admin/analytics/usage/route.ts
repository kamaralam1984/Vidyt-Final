export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const topUsers = await User.find({
        role: { $ne: 'super-admin' }, // exclude founders
        'usageStats.videosAnalyzed': { $gt: 0 }
    })
    .sort({ 'usageStats.videosAnalyzed': -1 })
    .limit(10)
    .select('name email subscription usageStats.videosAnalyzed usageStats.hashtagsGenerated usageStats.competitorsTracked createdAt lastLogin');

    // Aggregate global absolute usage metric
    const globalUsageStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalVideos: { $sum: '$usageStats.videosAnalyzed' },
          totalHashtags: { $sum: '$usageStats.hashtagsGenerated' },
          totalCompetitors: { $sum: '$usageStats.competitorsTracked' },
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        topUsers,
        globalUsageStats: globalUsageStats.length > 0 ? globalUsageStats[0] : { totalVideos: 0, totalHashtags: 0, totalCompetitors: 0 }
      }
    });

  } catch (error: any) {
    console.error('Analytics usage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage analytics' },
      { status: 500 }
    );
  }
}
