export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

const year = new Date().getFullYear();

function heuristicKeywords(topic: string): string[] {
  const t = topic.trim();
  const words = t.split(/\s+/).filter(Boolean);
  const base = words[0] || 'video';
  const modifiers = [
    'tutorial', 'guide', 'tips', 'tricks', 'strategy', 'secrets',
    'beginners', 'advanced', 'how to', 'explained', 'complete',
    'best', 'top', 'proven', 'viral', 'trending',
  ];
  const kws: string[] = [t];
  for (const mod of modifiers) kws.push(`${t} ${mod}`);
  kws.push(`${base} ${year}`, `best ${t}`, `${t} for beginners`, `${t} masterclass`);
  return [...new Set(kws)].slice(0, 20);
}

function heuristicTitles(topic: string): string[] {
  const t = topic.trim();
  return [
    `How To ${t} - Complete Guide ${year}`,
    `${t}: Secrets Nobody Tells You`,
    `${t} Tutorial For Beginners`,
    `5 ${t} Tips That Actually Work`,
    `The Ultimate ${t} Strategy ${year}`,
    `${t}: Step By Step Guide`,
    `${t} - What You Need To Know`,
    `Top 10 ${t} Tricks Pros Use`,
    `${t} Blueprint For Success`,
    `${t}: Everything Explained`,
  ];
}

function heuristicDescriptions(topic: string): string[] {
  const t = topic.trim();
  return [
    `Learn everything about ${t} in this complete ${year} guide. From basics to advanced techniques, this tutorial covers all you need to succeed with ${t}. Perfect for beginners and professionals.`,
    `Master ${t} with proven strategies and expert tips. Discover how top creators dominate the ${t} space with insider knowledge and step-by-step methods that get real results.`,
    `Complete breakdown of ${t} and how to excel. Get actionable insights from industry experts who have achieved massive success with ${t}. Start your journey today.`,
    `Everything you need to know about ${t}. From fundamentals to advanced techniques, this guide covers the complete spectrum of ${t} expertise with real examples.`,
    `Transform your approach to ${t}. Learn cutting-edge strategies and techniques that successful professionals use daily to achieve outstanding results with ${t} in ${year}.`,
  ];
}

function heuristicHashtags(topic: string): string[] {
  const t = topic.trim();
  const words = t.split(/\s+/).filter(Boolean);
  const clean = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');
  const topicTags = [
    `#${clean(t)}`,
    ...words.map((w) => `#${clean(w)}`),
    `#${clean(t)}tips`,
    `#${clean(t)}guide`,
    `#${clean(t)}tutorial`,
    `#${clean(t)}${year}`,
    `#${clean(words[0] || 'video')}viral`,
    `#${clean(words[0] || 'video')}trending`,
  ];
  const general = [
    '#viral', '#trending', '#youtube', '#youtubetips', '#contentcreator',
    '#seo', '#growyoutube', '#youtubemarketing', '#videomarketing',
    '#digitalmarketing', '#socialmedia', '#contentmarketing', '#engagement',
    '#subscribers', '#views', '#ctr', '#algorithm', '#youtubealgorthm',
    '#shorts', '#youtubeshorts', '#tutorial', '#howto', '#guide',
    '#tips', '#tricks', '#hacks', '#secrets', '#strategy', '#success',
    '#motivation', '#inspiration', '#education', '#learning', '#knowledge',
    '#growth', '#online', '#business', '#branding', '#influence',
  ];
  return [...new Set([...topicTags, ...general])].slice(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const topic = ((body.topic as string) || 'viral content').trim();
    const title = ((body.title as string) || '').trim();
    const description = ((body.description as string) || '').trim();

    const context = title || topic;

    // Layer 1: AI-powered generation
    try {
      const aiRes = await routeAI({
        prompt: `You are a YouTube SEO expert targeting 12.5%+ CTR. Generate highly specific, topic-matched SEO content. Return ONLY valid JSON with no markdown.

Video Topic: "${context}"
${description ? `Description context: "${description.slice(0, 200)}"` : ''}
Year: ${year}
CTR Target: 12.5%+

Return JSON:
{
  "keywords": [<20 specific keywords/phrases directly related to the topic, mix of short and long-tail, ordered by search volume>],
  "titles": [<10 YouTube title variants ALL targeting 12.5%+ CTR - MUST use: numbers, power words (Secret/Ultimate/Proven/Shocking/Best), brackets [like this] or (like this), question words OR curiosity gaps, 55-70 chars each>],
  "descriptions": [<5 SEO-optimized YouTube descriptions, each 200-400 chars, topic-specific, include 3-5 keywords naturally, end with CTA (Subscribe/Like/Comment), add 5 relevant hashtags at end>],
  "hashtags": [<50 relevant hashtags starting with # - topic-specific first, then niche, then trending: #viral #youtube #trending>]
}

CRITICAL title rules for 12.5%+ CTR:
- MUST include a number (5, 10, 7, etc.)
- MUST include brackets [PROVEN] or (2026 Guide)
- MUST have power word: Secret/Ultimate/Proven/Shocking/Best/Never/Must/Viral/Exposed/Revealed
- 55-70 character sweet spot
- 1-2 ALL CAPS words for emphasis
- ALL content must directly relate to "${context}" only`,
        cacheKey: `seo-gen:${context}:${description.slice(0, 40)}`.slice(0, 120),
        cacheTtlSec: 600,
        timeoutMs: 25000,
        fallbackText: '',
      });

      if (aiRes.provider !== 'fallback' && aiRes.text) {
        const d = aiRes.parseJson() as any;
        if (
          Array.isArray(d?.keywords) && d.keywords.length >= 5 &&
          Array.isArray(d?.titles) && d.titles.length >= 3 &&
          Array.isArray(d?.descriptions) && d.descriptions.length >= 2 &&
          Array.isArray(d?.hashtags) && d.hashtags.length >= 10
        ) {
          return NextResponse.json({
            keywords: d.keywords.slice(0, 20).map(String),
            titles: d.titles.slice(0, 10).map(String),
            descriptions: d.descriptions.slice(0, 5).map(String),
            hashtags: d.hashtags.slice(0, 50).map(String),
            topic: context,
            _provider: aiRes.provider,
            generatedAt: new Date().toISOString(),
          });
        }
      }
    } catch { /* fall through to heuristics */ }

    // Layer 2: Topic-specific heuristics
    return NextResponse.json({
      keywords: heuristicKeywords(context),
      titles: heuristicTitles(context),
      descriptions: heuristicDescriptions(context),
      hashtags: heuristicHashtags(context),
      topic: context,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('SEO generation error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to generate SEO content' },
      { status: 500 }
    );
  }
}
