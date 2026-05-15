export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

/**
 * Instagram profile-summary route.
 *
 * Compliance: NO scraping. We never fetch instagram.com HTML or use a spoofed
 * User-Agent (Instagram Platform Policy + Meta Platform Terms forbid it). The
 * profile URL is parsed locally to extract a slug; everything else comes from
 * an AI prompt or static fallbacks. Real profile metrics (followers, posts,
 * bio) must come from the official Instagram Graph API via OAuth — that path
 * is recommended as a future enhancement.
 */

function extractProfileIdentifier(url: string): string | null {
  const u = url.trim().toLowerCase();
  if (!u.includes('instagram.com')) return null;
  try {
    const clean = u.replace(/^https?:\/\//, '').split('/').filter(Boolean);
    const host = clean[0];
    const slug = clean[1];
    if (
      (host === 'instagram.com' || host === 'www.instagram.com') &&
      slug &&
      !['p', 'reel', 'reels', 'stories', 'tv', 'explore', 'direct', 'accounts'].includes(slug)
    ) {
      return slug.replace(/[^a-z0-9._]/gi, '');
    }
    return null;
  } catch {
    return null;
  }
}

function profileNameFromSlug(slug: string): string {
  return slug
    .split(/[._]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const FALLBACK_GROWTH_ACTIONS: { where: string; action: string; reason: string }[] = [
  { where: 'Bio',                action: 'Bio me clear description, niche keywords aur 1 link likhein (150 chars limit)', reason: 'Visitor turant samajh sake aap kya karte hain aur kyun follow karein' },
  { where: 'Profile Photo',      action: 'High-res profile picture (face ya logo) — circle crop safe', reason: 'Recognition + algorithmic trust signal' },
  { where: 'Highlights',         action: '5–7 Story Highlights banayein — Intro, Services, Reviews, Behind-the-scenes', reason: 'New visitors ke liye instant context' },
  { where: 'Reels',              action: 'Hafte me 4–6 Reels post karein — 7-15 sec, hook in first 1.5 sec', reason: 'Reels Explore aur Suggested feed me sabse zyada reach deta hai' },
  { where: 'Posting Schedule',   action: 'Consistent slots: weekdays 8-10 AM / 6-8 PM IST, weekends 11 AM-1 PM', reason: 'Algorithm regular posters ko boost karta hai' },
  { where: 'Hashtags',           action: 'Mix: 3 broad (#viral) + 5 mid-niche + 5 long-tail micro-niche tags', reason: 'Broad tags pe drown ho jaate ho; long-tails se discoverability badhti hai' },
  { where: 'Captions',           action: 'Hook line first 125 chars me, value/story middle, CTA last', reason: 'Mobile preview cut-off ke pehle hook chahiye, "more" tap unlock karta hai' },
  { where: 'Engagement',         action: 'First 30 min me audience comments ke turant reply karein', reason: 'Initial velocity Explore push trigger karta hai' },
  { where: 'Collaborations',     action: 'Mahine me 1-2 collab Reels (Invite Collaborator feature)', reason: 'Cross-audience reach se follower growth' },
];

function slugBasedVariation(
  profileName: string,
  slug: string,
): {
  homepageKeywords: { keyword: string; score: number }[];
  recommendedKeywords: { keyword: string; score: number }[];
} {
  const base = (profileName || slug).toLowerCase().replace(/\s+/g, '');
  const seed = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const homepageKeywords = [
    { keyword: base || 'profile',  score: 90 },
    { keyword: 'instagram',         score: 84 + (seed % 8) },
    { keyword: 'reels',             score: 80 + (seed % 12) },
    { keyword: 'explore',           score: 76 + (seed % 10) },
    { keyword: 'viral',             score: 74 + (seed % 12) },
    { keyword: 'trending',          score: 71 + (seed % 10) },
    { keyword: 'follow',            score: 67 + (seed % 8) },
  ];

  const recommendedKeywords = [
    { keyword: base || 'brand',     score: 88 },
    { keyword: 'reels',             score: 80 + (seed % 10) },
    { keyword: 'viral',             score: 78 + (seed % 8) },
    { keyword: 'trending',          score: 76 + (seed % 8) },
    { keyword: 'instagram',         score: 84 + (seed % 6) },
    { keyword: 'explore',           score: 74 + (seed % 8) },
    { keyword: 'follow',            score: 70 + (seed % 8) },
    { keyword: 'share',             score: 67 + (seed % 8) },
    { keyword: 'like',              score: 65 + (seed % 6) },
    { keyword: 'story',             score: 62 + (seed % 6) },
  ];

  return {
    homepageKeywords,
    recommendedKeywords: recommendedKeywords.sort(() => (seed % 2 === 0 ? 1 : -1)),
  };
}

function normalizeAiError(err: unknown): string {
  if (!err) return 'Unknown error';
  const msg = typeof (err as { message?: string }).message === 'string' ? (err as { message: string }).message : String(err);
  if (/invalid.*api.*key|incorrect.*key|authentication/i.test(msg)) return 'Invalid API key';
  if (/rate limit|quota|429/i.test(msg)) return 'Rate limit / quota exceeded';
  if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(msg)) return 'Network / timeout';
  return msg.slice(0, 120);
}

async function getAIProfileAudit(
  profileUrl: string,
  profileName: string,
  slug: string,
): Promise<{
  homepageKeywords: { keyword: string; score: number }[];
  recommendedKeywords: { keyword: string; score: number }[];
  growthActions: { where: string; action: string; reason: string }[];
  provider: string;
} | null> {
  const prompt = `You are an Instagram growth + SEO expert. For this Instagram profile, return realistic profile-specific SEO data.

Profile URL: ${profileUrl}
Profile handle / slug: ${slug}
Display name: ${profileName}

Return ONLY valid JSON (no markdown, no code block) with this exact structure:
{
  "homepageKeywords": [ {"keyword": "string", "score": number 0-100}, ... 6-8 items ],
  "recommendedKeywords": [ {"keyword": "string", "score": number 0-100}, ... 8-12 items ],
  "growthActions": [ {"where": "string", "action": "string", "reason": "string"}, ... 5-8 items ]
}

Rules:
- Infer the likely niche from the handle/slug (e.g. "fitcoach_amit" → fitness, "foodie.ria" → food blogger).
- Keywords must be relevant to THAT inferred niche. Different profiles must get different keywords.
- Scores 60-95. Include the profile name or brand as a keyword if it makes sense.
- growthActions: Instagram-specific (where = Bio / Reels / Highlights / Hashtags / Stories / Collabs; action = exact tactic; reason = why it works in Instagram's algorithm).
- Keep text concise. Hinglish (Hindi + English) tone preferred.`;

  const parseResponse = (text: string) => {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0].replace(/,(\s*[}\]])/g, '$1')) as {
        homepageKeywords?: { keyword: string; score: number }[];
        recommendedKeywords?: { keyword: string; score: number }[];
        growthActions?: { where: string; action: string; reason: string }[];
      };
      if (parsed.homepageKeywords?.length || parsed.recommendedKeywords?.length || parsed.growthActions?.length) {
        return {
          homepageKeywords: Array.isArray(parsed.homepageKeywords) ? parsed.homepageKeywords.slice(0, 10) : [],
          recommendedKeywords: Array.isArray(parsed.recommendedKeywords) ? parsed.recommendedKeywords.slice(0, 12) : [],
          growthActions: Array.isArray(parsed.growthActions) ? parsed.growthActions.slice(0, 8) : [],
        };
      }
    } catch (_) {}
    return null;
  };

  try {
    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `instagram-profile-summary:${slug}`.toLowerCase(),
      cacheTtlSec: 180,
      fallbackText: '{}',
    });
    const parsed = parseResponse(ai.text || '');
    if (!parsed) return null;
    return { ...parsed, provider: ai.provider };
  } catch (e) {
    console.warn('instagram profile ai audit fallback:', normalizeAiError(e));
  }
  return null;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const profileUrl = (searchParams.get('profileUrl') || searchParams.get('pageUrl') || searchParams.get('url') || '').trim();
  if (!profileUrl) {
    return NextResponse.json({ error: 'profileUrl ya pageUrl required' }, { status: 400 });
  }

  const slug = extractProfileIdentifier(profileUrl);
  if (!slug) {
    return NextResponse.json({
      error: 'Invalid Instagram URL',
      suggestion: 'Use format: https://www.instagram.com/username',
    }, { status: 400 });
  }

  const profileName = profileNameFromSlug(slug);

  // ── AI-driven profile audit (compliance-safe: prompt-only, no URL fetch) ──
  const aiResult = await getAIProfileAudit(profileUrl, profileName, slug);
  const aiProvider = aiResult?.provider ?? null;

  let homepageKeywords: { keyword: string; score: number }[];
  let recommendedKeywords: { keyword: string; score: number }[];
  let growthActions: { where: string; action: string; reason: string }[];

  if (aiResult?.homepageKeywords?.length || aiResult?.recommendedKeywords?.length || aiResult?.growthActions?.length) {
    homepageKeywords = (aiResult.homepageKeywords?.length ? aiResult.homepageKeywords : []).slice(0, 8);
    recommendedKeywords = (aiResult.recommendedKeywords?.length ? aiResult.recommendedKeywords : []).slice(0, 10);
    growthActions = (aiResult.growthActions?.length ? aiResult.growthActions : FALLBACK_GROWTH_ACTIONS).slice(0, 8);
  } else {
    const varied = slugBasedVariation(profileName, slug);
    homepageKeywords = varied.homepageKeywords;
    recommendedKeywords = varied.recommendedKeywords;
    growthActions = FALLBACK_GROWTH_ACTIONS;
  }

  const aiError = aiResult ? undefined : 'All AI providers unavailable. Served backend fallback.';

  const res = NextResponse.json({
    profileName,
    profileSlug: slug,
    followersCount: 0,
    postsCount: 0,
    profileDescription: '',
    profileKami: [] as string[],
    settingKami: [
      'Profile link save ho gaya — audit is based on the handle/slug + AI only.',
      'Real-time followers, posts count, bio aur engagement metrics ke liye Instagram Graph API connect karein (Settings → Connections → Instagram Business).',
    ],
    homepageKeywords,
    growthActions,
    recommendedKeywords,
    linked: true,
    aiProvider: aiProvider ?? undefined,
    aiError,
  });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}
