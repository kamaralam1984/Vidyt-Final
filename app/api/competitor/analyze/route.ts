export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompetitor } from '@/services/competitor/intelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, competitorId, platform } = body;

    if (!userId || !competitorId || !platform) {
      return NextResponse.json(
        { error: 'userId, competitorId, and platform are required' },
        { status: 400 }
      );
    }

    const insights = await analyzeCompetitor(
      userId,
      competitorId,
      platform as 'youtube' | 'facebook' | 'instagram'
    );

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error: any) {
    console.error('Competitor analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze competitor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
