export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateEngagementHeatmap } from '@/services/analytics/advanced';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const heatmap = await generateEngagementHeatmap(authUser.id);

    return NextResponse.json({
      success: true,
      heatmap,
    });
  } catch (error: any) {
    console.error('Heatmap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate heatmap' },
      { status: 500 }
    );
  }
}
