import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import ToolRequest from '@/models/ToolRequest';
import User from '@/models/User';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    await connectDB();
    const { topic, userId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const now = new Date();
        const lastReq = user.usageStats?.lastRequestDate;
        let todayCount = user.usageStats?.requestsToday || 0;

        if (lastReq && lastReq.toDateString() !== now.toDateString()) {
          todayCount = 0;
        }

        if (todayCount >= 20) {
          return NextResponse.json({ error: "Limit reached" }, { status: 429 });
        }

        if (!user.usageStats) user.usageStats = { videosAnalyzed: 0, analysesThisMonth: 0, competitorsTracked: 0, hashtagsGenerated: 0 };
        user.usageStats.requestsToday = todayCount + 1;
        user.usageStats.lastRequestDate = now;
        await user.save();
      }
    }

    const prompt = `Generate 15 highly searched, SEO-optimized YouTube hashtags for a video about: "${topic}".
    The hashtags should include a mix of broad, high-volume tags, and specific long-tail tags.
    Output strictly as a JSON array of strings containing the hashtags (include the # symbol).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{"hashtags": []}';
    let outputList = [];
    
    try {
      const parsed = JSON.parse(responseText);
      outputList = parsed.hashtags || [];
    } catch {
      outputList = [];
    }

    if (userId) {
      await ToolRequest.create({
        user: userId,
        toolType: 'hashtag-generator',
        inputData: { topic },
        generatedOutput: outputList,
        status: 'completed',
        tokensUsed: completion.usage?.total_tokens || 0,
      });
    }

    return NextResponse.json({ success: true, hashtags: outputList });
  } catch (error) {
    console.error('Hashtag Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate hashtags' }, { status: 500 });
  }
}
