import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import {
  getAnalyticsOverview,
  getBenchmarkComparison,
  generateEngagementHeatmap,
} from '@/services/analytics/advanced';
import { generateInsights } from '@/services/analytics/insightsEngine';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const [overview, heatmap, benchmark] = await Promise.all([
      getAnalyticsOverview(authUser.id, startDate, endDate),
      generateEngagementHeatmap(authUser.id),
      getBenchmarkComparison(authUser.id),
    ]);

    const insights = generateInsights(overview, heatmap);
    const cleanedInsights = insights.map((s) => s.replace(/\*\*/g, ''));

    return NextResponse.json({
      success: true,
      overview,
      heatmap,
      benchmark,
      insights: cleanedInsights,
    });
  } catch (error: unknown) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
