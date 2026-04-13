export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import AIHook from '@/models/AIHook';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'hook_generator');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json();
    const { topic, niche, platform, tone, language } = body;
    if (!topic?.trim()) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const topicTrimmed = topic.trim();
    const platLabel = (platform || 'YouTube').trim();
    const toneLabel = (tone || 'Shocking').trim();
    const langLabel = (language || 'English').trim();
    const nicheLabel = (niche || '').trim();
    const today = new Date().toISOString().slice(0, 10);

    // 1) Fetch real trending data for this topic
    let trendingContext = '';
    try {
      const { getTrendingTopics } = await import('@/services/trendingEngine');
      const trends = await getTrendingTopics([topicTrimmed], platLabel.toLowerCase() as any);
      if (trends.length > 0) {
        trendingContext = `\n\nCURRENT TRENDING DATA (use this for hooks):\n${trends.slice(0, 10).map((t, i) => `${i + 1}. "${t.keyword}" (viral score: ${t.score}%)`).join('\n')}`;
      }
    } catch { /* silent */ }

    // 2) Fetch YouTube trending titles for context
    let ytTrendContext = '';
    try {
      const { routeYouTubeSearch } = await import('@/lib/youtube-router');
      const ytRes = await routeYouTubeSearch(topicTrimmed, 10);
      if (ytRes.results.length > 0) {
        ytTrendContext = `\n\nTOP YOUTUBE VIDEOS FOR "${topicTrimmed}" RIGHT NOW:\n${ytRes.results.slice(0, 8).map((v, i) => `${i + 1}. "${v.title}" (${v.viewCount.toLocaleString()} views)`).join('\n')}`;
      }
    } catch { /* silent */ }

    const prompt = `You are the world's #1 viral hook expert. Generate exactly 10 viral hooks for a ${platLabel} video about "${topicTrimmed}".

DATE: ${today}
TOPIC: "${topicTrimmed}"
${nicheLabel ? `NICHE: ${nicheLabel}` : ''}
PLATFORM: ${platLabel}
TONE: ${toneLabel}
LANGUAGE: ${langLabel}
${trendingContext}
${ytTrendContext}

RULES:
1. Each hook must be the FIRST sentence a viewer hears in the first 3 seconds
2. Hooks must be DIRECTLY about "${topicTrimmed}" — not generic
3. Use REAL current data, names, numbers, and facts related to "${topicTrimmed}" from the trending data above
4. Make hooks sound like breaking news / shocking revelation / urgent update about "${topicTrimmed}"
5. Include specific numbers, dates, names when possible (makes it feel real and current)
6. Hooks should make viewer IMPOSSIBLE to scroll past
7. Write in ${langLabel} language
8. Match ${toneLabel} tone
9. Each hook must use a different psychology trigger

Return ONLY pure JSON (no markdown):
{
  "hooks": [
    {
      "hook": "exact hook text the creator says in first 3 seconds",
      "psychologyType": "one of: Curiosity Gap, Fear of Missing Out, Pattern Interrupt, Social Proof, Controversy, Urgency, Shock Value, Emotional Trigger, Open Loop, Authority",
      "whyItWorks": "1-line explanation why this hook grabs attention for ${topicTrimmed}"
    }
  ]
}`;

    // Generate smart fallback hooks from topic (used if AI fails)
    const psychTypes = ['Curiosity Gap', 'Shock Value', 'Fear of Missing Out', 'Pattern Interrupt', 'Urgency', 'Controversy', 'Social Proof', 'Emotional Trigger', 'Open Loop', 'Authority'];
    const smartFallbackHooks = [
      { hook: `BREAKING: ${topicTrimmed} — what just happened will shock you`, psychologyType: psychTypes[0], whyItWorks: `Creates curiosity gap about ${topicTrimmed}` },
      { hook: `Nobody is talking about this ${topicTrimmed} update — here's the truth`, psychologyType: psychTypes[1], whyItWorks: `Shock value + exclusivity about ${topicTrimmed}` },
      { hook: `If you don't know this about ${topicTrimmed}, you're already behind`, psychologyType: psychTypes[2], whyItWorks: `Fear of missing out on ${topicTrimmed} info` },
      { hook: `Stop everything — ${topicTrimmed} just changed the game completely`, psychologyType: psychTypes[3], whyItWorks: `Pattern interrupt forces attention on ${topicTrimmed}` },
      { hook: `You have 24 hours before ${topicTrimmed} affects you directly`, psychologyType: psychTypes[4], whyItWorks: `Creates urgency around ${topicTrimmed}` },
      { hook: `Everyone is wrong about ${topicTrimmed} — here's what's really happening`, psychologyType: psychTypes[5], whyItWorks: `Controversial take on ${topicTrimmed} drives clicks` },
      { hook: `10 million people already saw this ${topicTrimmed} video — did you?`, psychologyType: psychTypes[6], whyItWorks: `Social proof makes ${topicTrimmed} feel important` },
      { hook: `This ${topicTrimmed} story made me lose sleep last night`, psychologyType: psychTypes[7], whyItWorks: `Emotional connection to ${topicTrimmed}` },
      { hook: `I found something about ${topicTrimmed} that changes everything — wait for it`, psychologyType: psychTypes[8], whyItWorks: `Open loop about ${topicTrimmed} keeps viewer watching` },
      { hook: `As someone who's studied ${topicTrimmed} for years — this is unprecedented`, psychologyType: psychTypes[9], whyItWorks: `Authority position on ${topicTrimmed} builds trust` },
    ];

    let result: { hooks: { hook: string; psychologyType: string; whyItWorks: string }[] };

    try {
      const aiRes = await routeAI({
        prompt,
        cacheKey: `hooks:${topicTrimmed}:${platLabel}:${toneLabel}:${langLabel}:${today}`,
        cacheTtlSec: 1800,
      });

      const match = aiRes.text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed.hooks) && parsed.hooks.length > 0) {
          result = parsed;
        } else {
          result = { hooks: smartFallbackHooks };
        }
      } else {
        result = { hooks: smartFallbackHooks };
      }
    } catch (aiErr) {
      console.error('[HookGen] AI failed, using smart fallback:', aiErr);
      result = { hooks: smartFallbackHooks };
    }

    // Save to DB
    try {
      await connectDB();
      await AIHook.create({
        userId: access.userId,
        topic: topicTrimmed,
        niche: nicheLabel,
        platform: platLabel,
        hooks: result.hooks,
      });
    } catch { /* silent DB error */ }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
