export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

function extractPageIdentifier(url: string): { slug: string; isProfile: boolean } | null {
  const u = url.trim().toLowerCase();
  if (!u.includes('facebook.com') && !u.includes('fb.com') && !u.includes('fb.me')) return null;
  try {
    const clean = u.replace(/^https?:\/\//, '').split('/').filter(Boolean);
    if (u.includes('profile.php')) {
      const idMatch = u.match(/id=(\d+)/);
      return idMatch ? { slug: `profile_${idMatch[1]}`, isProfile: true } : null;
    }
    if (u.includes('pages/')) {
      const idx = clean.indexOf('pages');
      const name = clean[idx + 1];
      return name ? { slug: name.replace(/[^a-z0-9_-]/gi, ''), isProfile: false } : null;
    }
    const host = clean[0];
    const slug = clean[1];
    if ((host === 'facebook.com' || host === 'www.facebook.com' || host === 'fb.com') && slug && !['pages', 'watch', 'share', 'reel', 'photo', 'video', 'groups', 'events', 'messages'].includes(slug))
      return { slug: slug.replace(/[^a-z0-9._-]/gi, ''), isProfile: slug === 'profile.php' };
    return null;
  } catch {
    return null;
  }
}

function pageNameFromSlug(slug: string, isProfile: boolean): string {
  if (isProfile) return slug.startsWith('profile_') ? `Profile ${slug.replace('profile_', '')}` : slug;
  return slug
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Fetch og:title and og:description from page HTML (best-effort; Facebook may block or require login). */
async function fetchPageMeta(pageUrl: string): Promise<{ title?: string; description?: string }> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i) || html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/i);
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i) || html.match(/<meta\s+content="([^"]*)"\s+property="og:description"/i);
    return {
      title: titleMatch?.[1]?.trim() || undefined,
      description: descMatch?.[1]?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

const FALLBACK_GROWTH_ACTIONS: { where: string; action: string; reason: string }[] = [
  { where: 'Page About', action: 'About section me page description, keywords aur contact details likhein', reason: 'Log samajh sake page kya hai, follow kyun karein' },
  { where: 'Cover Photo', action: 'Cover image set karein (820x312) — brand ya main message', reason: 'First impression strong hota hai' },
  { where: 'Profile Photo', action: 'Clear profile picture (logo ya face) set karein', reason: 'Recognition aur trust' },
  { where: 'Posting Schedule', action: 'Regular post karein — reels/shorts 1–2 roz, posts bhi', reason: 'Algorithm aur followers dono ko consistency pasand hai' },
  { where: 'Reels / Video', action: 'Reels aur video zyada share karein — engagement badhti hai', reason: 'Facebook reels ko zyada reach deta hai' },
  { where: 'Call to Action', action: 'Post me "Follow karein", "Share karein", "Comment me bataen" jaisa CTA add karein', reason: 'Engagement badhne se reach aur growth' },
];

function slugBasedVariation(
  pageName: string,
  slug: string
): { homepageKeywords: { keyword: string; score: number }[]; recommendedKeywords: { keyword: string; score: number }[] } {
  const base = pageName.toLowerCase().replace(/\s+/g, '');
  const seed = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const baseKeywords = [
    { keyword: 'facebook', score: 82 + (seed % 10) },
    { keyword: base || 'page', score: 88 },
    { keyword: 'viral', score: 75 + (seed % 15) },
    { keyword: 'reels', score: 78 + (seed % 12) },
    { keyword: 'trending', score: 72 + (seed % 10) },
    { keyword: 'follow', score: 68 + (seed % 12) },
    { keyword: 'page', score: 65 + (seed % 10) },
  ];
  const rec = [
    { keyword: base || 'brand', score: 85 },
    { keyword: 'viral', score: 76 + (seed % 14) },
    { keyword: 'reels', score: 77 + (seed % 11) },
    { keyword: 'trending', score: 74 + (seed % 10) },
    { keyword: 'facebook', score: 82 + (seed % 8) },
    { keyword: 'follow', score: 70 + (seed % 10) },
    { keyword: 'share', score: 68 + (seed % 10) },
    { keyword: 'like', score: 66 + (seed % 8) },
  ];
  return {
    homepageKeywords: baseKeywords.filter((_, i) => i < 7),
    recommendedKeywords: rec.sort(() => (seed % 2 === 0 ? 1 : -1)),
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

/** Call AI to get page-specific keywords and growth actions. Returns result or null and sets outError. */
async function getAIPageAudit(
  pageUrl: string,
  pageName: string,
  meta: { title?: string; description?: string }
): Promise<{
  homepageKeywords: { keyword: string; score: number }[];
  recommendedKeywords: { keyword: string; score: number }[];
  growthActions: { where: string; action: string; reason: string }[];
  provider: string;
} | null> {
  const prompt = `You are a Facebook page SEO expert. For this Facebook page/link, suggest REAL-TIME accurate SEO data.

Page URL: ${pageUrl}
Page name/slug: ${pageName}
${meta.title ? `Page title (from link): ${meta.title}` : ''}
${meta.description ? `Page description (from link): ${meta.description.slice(0, 400)}` : ''}

Return ONLY valid JSON (no markdown, no code block) with this exact structure:
{
  "homepageKeywords": [ {"keyword": "string", "score": number 0-100}, ... 6-8 items ],
  "recommendedKeywords": [ {"keyword": "string", "score": number 0-100}, ... 6-10 items ],
  "growthActions": [ {"where": "string", "action": "string", "reason": "string"}, ... 4-6 items ]
}

Rules:
- Keywords should be relevant to THIS page (use page name/topic). Different pages must get different keywords.
- Scores 65-95. Include the page name or brand as a keyword if it makes sense.
- growthActions: specific, actionable tips for this page (where = place like "Page About", "Cover Photo"; action = what to do; reason = why).
- Keep text concise. Use Hindi/English mix if needed.`;

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
          growthActions: Array.isArray(parsed.growthActions) ? parsed.growthActions.slice(0, 6) : [],
        };
      }
    } catch (_) {}
    return null;
  };

  try {
    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `facebook-page-summary:${pageName}`.toLowerCase(),
      cacheTtlSec: 180,
      fallbackText: '{}',
    });
    const parsed = parseResponse(ai.text || '');
    if (!parsed) return null;
    return { ...parsed, provider: ai.provider };
  } catch (e) {
    console.warn('facebook page ai audit fallback:', normalizeAiError(e));
  }
  return null;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const pageUrl = (searchParams.get('pageUrl') || searchParams.get('profileUrl') || searchParams.get('url') || '').trim();
  if (!pageUrl) {
    return NextResponse.json({ error: 'pageUrl ya profileUrl required' }, { status: 400 });
  }

  const parsed = extractPageIdentifier(pageUrl);
  if (!parsed) {
    return NextResponse.json({
      error: 'Invalid Facebook URL',
      suggestion: 'Use format: https://www.facebook.com/YourPageName or https://facebook.com/profile.php?id=...',
    }, { status: 400 });
  }

  const pageName = pageNameFromSlug(parsed.slug, parsed.isProfile);

  const meta = await fetchPageMeta(pageUrl);
  let aiResult: Awaited<ReturnType<typeof getAIPageAudit>> = null;
  let aiProvider: string | null = null;
  aiResult = await getAIPageAudit(pageUrl, pageName, meta);
  if (aiResult) aiProvider = aiResult.provider;

  let homepageKeywords: { keyword: string; score: number }[];
  let recommendedKeywords: { keyword: string; score: number }[];
  let growthActions: { where: string; action: string; reason: string }[];

  if (aiResult?.homepageKeywords?.length || aiResult?.recommendedKeywords?.length || aiResult?.growthActions?.length) {
    homepageKeywords = (aiResult.homepageKeywords?.length ? aiResult.homepageKeywords : []).slice(0, 8);
    recommendedKeywords = (aiResult.recommendedKeywords?.length ? aiResult.recommendedKeywords : []).slice(0, 10);
    growthActions = (aiResult.growthActions?.length ? aiResult.growthActions : FALLBACK_GROWTH_ACTIONS).slice(0, 6);
  } else {
    const varied = slugBasedVariation(pageName, parsed.slug);
    homepageKeywords = varied.homepageKeywords;
    recommendedKeywords = varied.recommendedKeywords;
    growthActions = FALLBACK_GROWTH_ACTIONS;
  }

  const pageKami: string[] = [];
  const settingKami: string[] = [];
  const aiError = aiResult ? undefined : 'All AI providers unavailable. Served backend fallback.';

  const res = NextResponse.json({
    pageName,
    pageSlug: parsed.slug,
    isProfile: parsed.isProfile,
    followersCount: 0,
    postsCount: 0,
    pageDescription: meta.description || '',
    pageKami,
    settingKami: settingKami.length ? settingKami : ['Page link save ho gaya. Facebook Graph API set karein to followers, posts count aur detailed audit milega.'],
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
