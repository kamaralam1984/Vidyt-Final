import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { predictViralPotential } from '@/services/ai/viralPredictor';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ apiKey });
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Check usage limits
    const today = new Date().setHours(0, 0, 0, 0);
    if (user.usageStats?.lastRequestDate?.getTime() === today && (user.usageStats?.requestsToday || 0) > 100) {
        return NextResponse.json({ error: 'Daily limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { hookScore, thumbnailScore, titleScore, trendingScore, videoDuration, platform } = body;

    if (!hookScore || !thumbnailScore || !titleScore) {
      return NextResponse.json({ error: 'Missing required features: hookScore, thumbnailScore, titleScore' }, { status: 400 });
    }

    const prediction = await predictViralPotential({
      hookScore: Number(hookScore),
      thumbnailScore: Number(thumbnailScore),
      titleScore: Number(titleScore),
      trendingScore: Number(trendingScore || 50),
      videoDuration: Number(videoDuration || 60),
      postingTime: { day: 'Monday', hour: 12 }, // Default or from body
      hashtags: body.hashtags || [],
      platform: platform || 'youtube',
    });

    // Update usage stats
    await User.updateOne(
        { _id: user._id },
        { 
            $inc: { 'usageStats.requestsToday': 1 },
            $set: { 'usageStats.lastRequestDate': new Date() }
        }
    );

    return NextResponse.json({
        success: true,
        data: prediction
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
