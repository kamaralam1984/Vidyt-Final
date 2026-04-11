export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getTrendingTopics } from '@/services/trendingEngine';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'General';

    const trends = await getTrendingTopics(category);

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
        data: trends
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
