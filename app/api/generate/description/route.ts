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
    const { topic, keywords, userId } = await req.json();

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

    const prompt = `Act as an expert YouTube SEO specialist. Write a highly optimized, engaging YouTube video description for a video about: "${topic}".
    Additional keywords to include: ${keywords || 'viral, growth, top tier'}.
    
    The description MUST:
    - Have a strong hook in the first 2 sentences.
    - Include a 3-paragraph detailed summary containing exactly LSI keywords natively.
    - Have a section for social media links.
    - Have a section for timestamps (mock data).
    
    Output strictly as a JSON object with a single key "description" containing the full formatted text string.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let outputData = '';
    
    try {
      const parsed = JSON.parse(responseText);
      outputData = parsed.description || responseText;
    } catch {
      outputData = responseText;
    }

    if (userId) {
      await ToolRequest.create({
        user: userId,
        toolType: 'description-generator',
        inputData: { topic, keywords },
        generatedOutput: outputData,
        status: 'completed',
        tokensUsed: completion.usage?.total_tokens || 0,
      });
    }

    return NextResponse.json({ success: true, description: outputData });
  } catch (error) {
    console.error('Description Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
