import { NextRequest, NextResponse } from 'next/server';
import { discoverTrends } from '@/services/trends/discovery';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'spikes', 'opportunities'

    let trends;

    if (type === 'spikes') {
      // Filter for rising trends (spikes)
      const allTrends = await discoverTrends();
      trends = allTrends.filter(t => t.trendType === 'rising' && t.growthVelocity > 100);
    } else {
      trends = await discoverTrends();
    }

    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Trend discovery error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to discover trends',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
