import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import ToolRequest from '@/models/ToolRequest';
import User from '@/models/User';

// Assuming standard API key setup in .env.local
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
          todayCount = 0; // reset for a new day
        }

        if (todayCount > 20) {
          return NextResponse.json({ error: "Limit reached" }, { status: 429 });
        }

        if (!user.usageStats) user.usageStats = { videosAnalyzed: 0, analysesThisMonth: 0, competitorsTracked: 0, hashtagsGenerated: 0 };
        user.usageStats.requestsToday = todayCount + 1;
        user.usageStats.lastRequestDate = now;
        await user.save();
      }
    }

    // Call OpenAI
    const prompt = `Act as an expert YouTube SEO specialist and gaming content strategist. 
    Generate 5 highly engaging, viral, and click-worthy YouTube titles for a video about: "${topic}".
    Ensure the titles:
    - Invoke curiosity, urgency, or authority.
    - Naturally include LSI keywords for better YouTube search ranking.
    - Are under 65 characters to avoid truncation.
    - Use a mix of English and popular Hinglish gaming phrasing if applicable.
    
    Output strictly as a JSON array of strings.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{"titles": []}';
    let outputList = [];
    try {
      const parsed = JSON.parse(responseText);
      outputList = parsed.titles || parsed;
      if (!Array.isArray(outputList)) outputList = [responseText]; // Fallback
    } catch {
      outputList = [responseText]; // Fallback to raw string
    }

    // Track usage in the Database (Monetization & Analytics Prep)
    if (userId) {
      await ToolRequest.create({
        user: userId,
        toolType: 'title-generator',
        inputData: { topic },
        generatedOutput: outputList,
        status: 'completed',
        tokensUsed: completion.usage?.total_tokens || 0,
      });
    }

    return NextResponse.json({ success: true, titles: outputList });
  } catch (error: any) {
    console.error('Title Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 });
  }
}
