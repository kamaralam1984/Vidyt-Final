export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { collectTrendingVideos } from '@/services/dataPipeline/viralDataset';

/**
 * Collect trending videos for viral dataset
 * Can be called manually or scheduled via cron
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    // Allow admin or scheduled jobs
    if (!authUser || (authUser.role !== 'admin' && !request.headers.get('x-scheduled-job'))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    console.log('🔄 Starting viral dataset collection...');
    const collected = await collectTrendingVideos();

    return NextResponse.json({
      success: true,
      message: `Collected ${collected} trending videos`,
      collected,
    });
  } catch (error: any) {
    console.error('Collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to collect trending videos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get collection status
 */
export async function GET(request: NextRequest) {
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    const ViralDataset = (await import('@/models/ViralDataset')).default;
    
    await connectDB();

    const totalVideos = await ViralDataset.countDocuments();
    const viralVideos = await ViralDataset.countDocuments({ isViral: true });
    const recentCollections = await ViralDataset.find()
      .sort({ collectedAt: -1 })
      .limit(10)
      .select('platform collectedAt title')
      .lean();

    return NextResponse.json({
      success: true,
      stats: {
        totalVideos,
        viralVideos,
        recentCollections: recentCollections.map(v => ({
          platform: v.platform,
          title: v.title,
          collectedAt: v.collectedAt,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get collection status' },
      { status: 500 }
    );
  }
}
