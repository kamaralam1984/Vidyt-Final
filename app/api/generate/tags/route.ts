import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ToolRequest from '@/models/ToolRequest';
import User from '@/models/User';
import { routeAI } from '@/lib/ai-router';
import { getWithFallback, setWithFallback } from '@/lib/in-memory-cache';
import { rateLimit, getClientIP, isIPBlocked, RATE_LIMITS } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  // IP-level rate limit: 30 tag generations / hour for anon users
  const ip = getClientIP(req);
  if (isIPBlocked(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }
  const rl = rateLimit(`gen-tags:${ip}`, RATE_LIMITS.analysis);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit reached. Please wait before generating again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 3600) } }
    );
  }

  try {
    await connectDB();
    const { topic, userId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Serve cached result for anon users (saves AI cost)
    const cacheKey = `gen:tags:${topic.toLowerCase().trim().slice(0, 80)}`;
    if (!userId) {
      const cached = await getWithFallback<{ hashtags: string[]; provider: string }>(cacheKey);
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

    const prompt = `Generate 15 highly searched, SEO-optimized YouTube hashtags for a video about: "${topic}".
    The hashtags should include a mix of broad, high-volume tags, and specific long-tail tags.
    Output strictly as a JSON array of strings containing the hashtags (include the # symbol).`;

    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `generate-tags:${topic}`.toLowerCase(),
      cacheTtlSec: 120,
      fallbackText: '{"hashtags":[]}',
    });

    const responseText = ai.text || '{"hashtags": []}';
    let outputList: string[] = [];
    try {
      const parsed = JSON.parse(responseText);
      outputList = parsed.hashtags || parsed || [];
    } catch {
      outputList = [];
    }

    const result = {
      hashtags: outputList,
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
        toolType: 'hashtag-generator',
        inputData: { topic },
        generatedOutput: outputList,
        status: 'completed',
        tokensUsed: 0,
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Hashtag Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate hashtags' }, { status: 500 });
  }
}
