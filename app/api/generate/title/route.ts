import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ToolRequest from '@/models/ToolRequest';
import User from '@/models/User';
import { routeAI } from '@/lib/ai-router';
import { getWithFallback, setWithFallback } from '@/lib/in-memory-cache';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { topic, userId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Cache AI results per topic (no user context) — saves AI API cost significantly
    const cacheKey = `gen:title:${topic.toLowerCase().trim().slice(0, 80)}`;
    if (!userId) {
      const cached = await getWithFallback<{ titles: string[]; provider: string }>(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, ...cached, fromCache: true });
      }
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

    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `generate-title:${topic}`.toLowerCase(),
      cacheTtlSec: 120,
      fallbackText: '{"titles":[]}',
    });
    const responseText = ai.text || '{"titles": []}';
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
        tokensUsed: 0,
      });
    }

    const result = {
      titles: outputList,
      provider: ai.provider,
      tier: ai.provider === 'fallback' ? 'local' : ['openai', 'gemini'].includes(ai.provider) ? 'paid' : 'free',
    };

    // Cache anonymous results for 10 minutes
    if (!userId) {
      await setWithFallback(cacheKey, result, 600);
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Title Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 });
  }
}
