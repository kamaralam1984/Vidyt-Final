export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { withFeatureLimit } from '@/middleware/usageGuard';
import { routeAI } from '@/lib/ai-router';

type ViralLevel = 'high' | 'medium' | 'low';
type ContentType = 'post' | 'reel' | 'story' | 'live';

// ─────────────────────────────────────
// Hardcoded fallback
// ─────────────────────────────────────
function fallbackHashtags(seed: string, contentType: ContentType): { tag: string; viralLevel: ViralLevel; viralScore: number }[] {
  const k = (seed || '').toLowerCase().trim().replace(/\s+/g, '');
  const base = k || 'viral';
  const custom = base ? [`#${base}`, `#${base}Tips`, `#${base}2025`, `#${base}Viral`] : [];
  const postTags = ['#instagram', '#viral', '#trending', '#reels', '#explore', '#like', '#follow', '#comment', '#instagood', '#content', '#creator', '#2025', '#photooftheday', '#instadaily'];
  const reelTags = ['#reels', '#instagramreels', '#reelsindia', '#viral', '#trending', '#explore', '#shortvideo', '#content', '#creator', '#2025', '#like', '#share', '#comment', '#fyp'];
  const storyTags = ['#story', '#instagram', '#instastory', '#viral', '#daily', '#instagood', '#2025'];
  const liveTags = ['#live', '#instagramlive', '#livestream', '#livevideo', '#viral', '#instagram', '#trending', '#watch', '#comment', '#2025'];
  const globalTags = contentType === 'reel' ? reelTags : contentType === 'story' ? storyTags : contentType === 'live' ? liveTags : postTags;
  const combined = [...custom, ...globalTags].slice(0, 25);
  const levels: ViralLevel[] = ['high', 'medium', 'low'];
  return combined.map((tag, i) => {
    const level = levels[i % 3] as ViralLevel;
    const viralScore = level === 'high' ? 75 + (i % 7) : level === 'medium' ? 50 + (i % 10) : 25 + (i % 15);
    return { tag, viralLevel: level, viralScore };
  });
}

// ─────────────────────────────────────
// AI-driven hashtag generation
// ─────────────────────────────────────
async function getAIHashtags(
  seed: string,
  contentType: ContentType,
): Promise<{ hashtags: { tag: string; viralLevel: ViralLevel; viralScore: number }[]; provider: string } | null> {
  const ctLabel = contentType === 'reel'
    ? 'Reel (short vertical video)'
    : contentType === 'story'
    ? 'Story (24h ephemeral)'
    : contentType === 'live'
    ? 'Live Stream'
    : 'Feed Post';
  const year = new Date().getFullYear();

  const prompt = `You are an Instagram hashtag strategist. Generate 25 hashtags for the niche/keyword below.

Niche / keyword: "${seed || 'general content'}"
Content type: ${ctLabel}
Year: ${year}

Hashtag rules:
- Mix THREE tiers (Instagram-specific volume bands):
  * "high"   → 1M+ posts on Instagram, broad-reach, very competitive (10 tags)
  * "medium" → 100k-1M posts, niche-relevant, balanced opportunity (10 tags)
  * "low"    → < 100k posts, hyper-niche, easiest to rank for discovery (5 tags)
- Every tag MUST start with '#' and be camelCase or lowercase (no spaces).
- Include 3-5 niche-specific tags derived from the seed keyword.
- Always include relevant Instagram platform tags (#reels, #instagramreels, #explore, #fyp, #instagood) when contextually right.
- For Indian-audience niches, include #reelsindia and Hindi/Hinglish brand variants.

Return ONLY this JSON (no markdown):
{
  "hashtags": [
    { "tag": "#example", "viralLevel": "high|medium|low", "viralScore": 0-100 },
    ... 25 items total
  ]
}
viralScore guidance: high=70-90, medium=45-69, low=20-44.`;

  const parse = (text: string) => {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      const j = JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')) as {
        hashtags?: { tag: string; viralLevel: ViralLevel; viralScore: number }[];
      };
      if (!Array.isArray(j.hashtags) || j.hashtags.length === 0) return null;
      return j.hashtags
        .filter((h) => h && typeof h.tag === 'string' && h.tag.length > 1)
        .slice(0, 30)
        .map((h) => {
          const tag = h.tag.trim().startsWith('#') ? h.tag.trim() : `#${h.tag.trim()}`;
          const level: ViralLevel = ['high', 'medium', 'low'].includes(h.viralLevel) ? h.viralLevel : 'medium';
          return {
            tag: tag.replace(/\s+/g, ''),
            viralLevel: level,
            viralScore: Math.max(15, Math.min(95, Math.round(Number(h.viralScore) || 60))),
          };
        });
    } catch {
      return null;
    }
  };

  try {
    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `ig-tags:${contentType}:${seed}`.toLowerCase(),
      cacheTtlSec: 240,
      fallbackText: '{}',
    });
    const parsed = parse(ai.text || '');
    if (!parsed || parsed.length === 0) return null;
    return { hashtags: parsed, provider: ai.provider };
  } catch {
    return null;
  }
}

async function handleGet(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('keyword') || '').trim();
  const contentType = (searchParams.get('contentType') || 'post') as ContentType;

  const aiResult = await getAIHashtags(keyword, contentType);
  const hashtags = aiResult?.hashtags?.length ? aiResult.hashtags : fallbackHashtags(keyword, contentType);

  return NextResponse.json({
    hashtags,
    aiProvider: aiResult?.provider,
    aiError: aiResult ? undefined : 'AI unavailable — served template fallback',
  });
}

export const GET = withFeatureLimit(handleGet, 'hashtagsPerPost');
