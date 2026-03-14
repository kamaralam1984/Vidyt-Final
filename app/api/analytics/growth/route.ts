import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateGrowthCurve } from '@/services/analytics/advanced';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    const growthCurve = await generateGrowthCurve(videoId);

    if (!growthCurve) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      growthCurve,
    });
  } catch (error: any) {
    console.error('Growth curve error:', error);
    return NextResponse.json(
      { error: 'Failed to generate growth curve' },
      { status: 500 }
    );
  }
}
