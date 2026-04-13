export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import { predictBestPostingTime } from '@/services/postingTimePredictor';
import { getApiConfig } from '@/lib/apiConfig';
import axios from 'axios';
import { routeAI } from '@/lib/ai-router';
import { routeYouTubeSearch } from '@/lib/youtube-router';

type Idea = {
  title: string;
  score: number;
  day: string;
  hour: number;
  timeLabel: string;
};

function formatHourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

async function fetchYouTubeTrendingTitles(_apiKey: string, niche: string | null): Promise<string[]> {
  try {
    const q = (niche && niche.trim()) || 'trending India news';
    // Use YouTube router with failover (YouTube API → SerpApi → RapidAPI)
    const { results } = await routeYouTubeSearch(q, 20);
    const titles: string[] = [];
    for (const item of results) {
      if (item.title && !titles.includes(item.title)) titles.push(item.title);
    }
    return titles.slice(0, 20);
  } catch {
    return [];
  }
}

async function buildIdeasFromAI(niche: string | null, trendingTitles: string[]): Promise<Idea[] | null> {
  const nicheText = (niche || 'YouTube growth tips').trim();
  const today = new Date().toISOString().slice(0, 10);
  const trendingBlock =
    trendingTitles.length > 0
      ? `Trending YouTube titles (aaj ke ya recent):\n- ${trendingTitles.slice(0, 10).join('\n- ')}\n\n`
      : '';

  const prompt = `You are a YouTube content strategist.

DATE: ${today}
NICHE / CHANNEL FOCUS: "${nicheText}"

${trendingBlock}Task:
- Aaj ke liye 5-8 **video ideas** do jo specifically is niche "${nicheText}" ke liye relevant hon.
- Ideas ko upar diye gaye trending titles se inspire karo, lekin exact copy mat karo — apni audience ke liye localized + unique banao.
- Har idea ke liye:
  - short **title** (max ~80 chars)
  - **score** (0-100) as \"viralScore\" – jitna zyada utna zyada potential
  - **bestPostingTime**: day (e.g. Tuesday) + hour (0-23, 24h format) when to post (India focus).

Return ONLY pure JSON (no markdown) with this exact structure:
{
  "ideas": [
    { "title": "string", "score": number, "day": "Tuesday", "hour": 19 },
    ...
  ]
}`;

  try {
    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `daily-ideas:${nicheText}`.toLowerCase(),
      cacheTtlSec: 180,
      fallbackText: '{}',
    });
    const text = ai.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0].replace(/,(\\s*[}\\]])/g, '$1')) as { ideas?: { title: string; score: number; day: string; hour: number }[] };
    if (!parsed.ideas?.length) return null;
    return parsed.ideas.slice(0, 8).map((idea) => {
      const time = predictBestPostingTime(nicheText, 'youtube');
      const hour = typeof idea.hour === 'number' ? idea.hour : time.hour;
      const day = idea.day || time.day;
      const safeScore = Math.max(40, Math.min(100, Math.round(idea.score)));
      return {
        title: idea.title || nicheText,
        score: safeScore,
        day,
        hour,
        timeLabel: formatHourLabel(hour),
      };
    });
  } catch {
    return null;
  }

  return null;
}

function buildFallbackIdeas(niche: string | null): Idea[] {
  const base = (niche || 'YouTube growth').trim() || 'YouTube growth';
  const time = predictBestPostingTime(base, 'youtube');
  const templates = [
    `Aaj hi try karo ye 3 ${base} hacks`,
    `Main ne 30 din tak ${base} kiya – kya result mila?`,
    `${base} ke liye 5 evergreen content ideas (${new Date().getFullYear()})`,
    `1 video per day ${base} challenge – planning & schedule`,
    `Beginner se pro tak: ${base} complete roadmap`,
  ];
  return templates.map((title, idx) => {
    const hour = time.hour + (idx % 3) - 1;
    const safeHour = ((hour % 24) + 24) % 24;
    const score = Math.max(60, Math.min(95, time.confidence - idx * 3 + Math.round(Math.random() * 4)));
    return {
      title,
      score,
      day: time.day,
      hour: safeHour,
      timeLabel: formatHourLabel(safeHour),
    };
  });
}

export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'daily_ideas');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const niche = typeof body.niche === 'string' ? body.niche : null;

    const config = await getApiConfig();
    const ytKey = config.youtubeDataApiKey?.trim();

    let trendingTitles: string[] = [];
    if (ytKey) {
      trendingTitles = await fetchYouTubeTrendingTitles(ytKey, niche);
    }

    const aiIdeas = await buildIdeasFromAI(niche, trendingTitles);
    const ideas = aiIdeas && aiIdeas.length ? aiIdeas : buildFallbackIdeas(niche);

    return NextResponse.json({
      ideas,
      niche: niche || null,
      usedYouTubeTrending: trendingTitles.length > 0,
      usedAI: Boolean(aiIdeas && aiIdeas.length),
      message: 'Aaj ke trending-style topic ideas niche aur best posting time ke hisaab se.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate daily ideas' }, { status: 500 });
  }
}


