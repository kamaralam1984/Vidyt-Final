export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { generatePostingHeatmap } from '@/services/postingTimePredictor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const platform = searchParams.get('platform') || 'youtube'; // youtube, facebook, instagram
    
    const heatmap = generatePostingHeatmap(platform as 'youtube' | 'facebook' | 'instagram');
    
    // Platform-specific best posting times
    const platformPostingTimes: Record<string, { day: string; hour: number; confidence: number }> = {
      youtube: { day: 'Tuesday', hour: 14, confidence: 75 },
      facebook: { day: 'Wednesday', hour: 13, confidence: 72 },
      instagram: { day: 'Monday', hour: 11, confidence: 78 },
    };
    
    const postingTime = platformPostingTimes[platform] || platformPostingTimes.youtube;
    
    return NextResponse.json({ heatmap, postingTime, platform });
  } catch (error) {
    console.error('Error generating posting time heatmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate posting time heatmap' },
      { status: 500 }
    );
  }
}
