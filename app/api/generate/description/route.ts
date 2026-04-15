import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ToolRequest from '@/models/ToolRequest';
import User from '@/models/User';
import { routeAI } from '@/lib/ai-router';
import { getWithFallback, setWithFallback } from '@/lib/in-memory-cache';
import { rateLimit, getClientIP, isIPBlocked, RATE_LIMITS } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  // IP-level rate limit: 30 description generations / hour for anon
  const ip = getClientIP(req);
  if (isIPBlocked(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }
  const rl = rateLimit(`gen-desc:${ip}`, RATE_LIMITS.analysis);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit reached. Please wait before generating again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 3600) } }
    );
  }

  try {
    await connectDB();
    const { topic, keywords, userId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Cache for anon users
    const cacheKey = `gen:desc:${topic.toLowerCase().trim().slice(0, 80)}:${(keywords || '').slice(0, 40)}`;
    if (!userId) {
      const cached = await getWithFallback<{ description: string; provider: string }>(cacheKey);
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
        if (lastReq && lastReq.toDateString() !== now.toDateString()) todayCount = 0;
        if (todayCount >= 20) {
          return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 });
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

    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `generate-description:${topic}:${keywords || ''}`.toLowerCase(),
      cacheTtlSec: 120,
      fallbackText: '{"description":""}',
    });

    const responseText = ai.text || '{}';
    let outputData = '';
    try {
      const parsed = JSON.parse(responseText);
      outputData = parsed.description || responseText;
    } catch {
      outputData = responseText;
    }

    const result = {
      description: outputData,
      provider: ai.provider,
      tier: ai.provider === 'fallback' ? 'local' : ['openai', 'gemini'].includes(ai.provider) ? 'paid' : 'free',
    };

    // Cache for anon users (10 min)
    if (!userId) {
      await setWithFallback(cacheKey, result, 600);
    }

    if (userId) {
      await ToolRequest.create({
        user: userId,
        toolType: 'description-generator',
        inputData: { topic, keywords },
        generatedOutput: outputData,
        status: 'completed',
        tokensUsed: 0,
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Description Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
