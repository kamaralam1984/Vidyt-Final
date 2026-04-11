export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function extractPageSlug(url: string, platform: 'facebook' | 'instagram'): string | null {
  const u = url.trim().toLowerCase();
  if (platform === 'facebook') {
    if (!u.includes('facebook.com') && !u.includes('fb.com')) return null;
    const match = u.match(/facebook\.com\/([^/?]+)/) || u.match(/fb\.com\/([^/?]+)/);
    if (match && !['pages', 'watch', 'share', 'reel', 'photo', 'video', 'groups', 'events', 'messages'].includes(match[1]))
      return match[1].replace(/[^a-z0-9._-]/gi, '');
  }
  if (platform === 'instagram') {
    if (!u.includes('instagram.com')) return null;
    const match = u.match(/instagram\.com\/([^/?]+)/);
    return match ? match[1].replace(/[^a-z0-9._]/gi, '') : null;
  }
  return null;
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

type AiResult = {
  bestDays?: string[];
  bestHours?: number[];
  summary?: string;
  slots?: { day: string; hour: number; share: number }[];
};

async function getAIBestPostingTime(
  platform: 'facebook' | 'instagram',
  pageUrl: string,
  pageName: string
): Promise<AiResult | null> {
  const platformLabel = platform === 'facebook' ? 'Facebook' : 'Instagram';
  const prompt = `You are a ${platformLabel} growth expert. For this ${platformLabel} page/profile, suggest the best posting times based on when the target audience is most active.

Page/Profile URL: ${pageUrl}
Page/Profile name or slug: ${pageName}

Return ONLY valid JSON (no markdown, no code block) with this exact structure:
{
  "bestDays": [ "Monday", "Tuesday", ... ] (2-4 day names from Sunday to Saturday),
  "bestHours": [ 9, 12, 18, 21 ] (2-5 hours in 24h format, 0-23),
  "summary": "One short sentence in Hindi/English: is page/audience ke liye kab post karein.",
  "slots": [
    { "day": "Wednesday", "hour": 13, "share": 85 },
    ...
  ] (3-6 slots: day, hour 0-23, share = relative score 60-95)
}

Rules:
- bestDays and bestHours should be specific to this type of page (e.g. news page vs entertainment).
- Use research-based typical peak times for ${platformLabel} in India if the page name suggests Indian audience.
- slots: list 3-6 best (day, hour) combinations with share as percentage score.`;

  try {
    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `social-posting-time:${platform}:${pageName}`.toLowerCase(),
      cacheTtlSec: 180,
      fallbackText: '{}',
    });
    const text = ai.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0].replace(/,(\s*[}\]])/g, '$1')) as AiResult;
      return parsed;
    }
  } catch (_) {}
  return null;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const platform = (searchParams.get('platform') || '').toLowerCase() as 'facebook' | 'instagram';
  const url = (searchParams.get('url') || searchParams.get('pageUrl') || searchParams.get('profileUrl') || '').trim();

  if (platform !== 'facebook' && platform !== 'instagram') {
    return NextResponse.json({ error: 'platform must be facebook or instagram' }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: 'url (or pageUrl/profileUrl) required' }, { status: 400 });
  }

  const slug = extractPageSlug(url, platform);
  const pageName = slug
    ? slug
        .split(/[._-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'Page';

  const aiResult = await getAIBestPostingTime(platform, url, pageName);

  if (!aiResult?.bestDays?.length && !aiResult?.bestHours?.length && !aiResult?.slots?.length) {
    const fallbackDays = platform === 'facebook' ? ['Tuesday', 'Wednesday', 'Thursday'] : ['Monday', 'Wednesday', 'Friday'];
    const fallbackHours = [9, 12, 18, 21];
    const fallbackSummary = `${pageName} ke liye: ${fallbackDays.join(', ')} ko ${fallbackHours.map(formatHour).join(', ')} pe post karein. AI key set karein (Super Admin) to is page ke hisaab se accurate time milega.`;
    return NextResponse.json({
      bestSlots: [
        { day: fallbackDays[0], hour: fallbackHours[1], timeLabel: formatHour(fallbackHours[1]), views: 0, share: 72 },
        { day: fallbackDays[1], hour: fallbackHours[2], timeLabel: formatHour(fallbackHours[2]), views: 0, share: 68 },
        { day: fallbackDays[2], hour: fallbackHours[3], timeLabel: formatHour(fallbackHours[3]), views: 0, share: 65 },
      ],
      bestDays: fallbackDays,
      bestHours: fallbackHours,
      summary: fallbackSummary,
      totalVideosAnalyzed: 0,
    });
  }

  const bestDays = Array.isArray(aiResult.bestDays)
    ? aiResult.bestDays.filter((d) => DAYS.includes(d)).slice(0, 5)
    : DAYS.slice(1, 4);
  const bestHours = Array.isArray(aiResult.bestHours)
    ? aiResult.bestHours.filter((h) => typeof h === 'number' && h >= 0 && h <= 23).slice(0, 5)
    : [9, 12, 18, 21];

  const slots = (aiResult.slots || []).slice(0, 8).map((s) => ({
    day: DAYS.includes(s.day) ? s.day : bestDays[0] || 'Wednesday',
    hour: typeof s.hour === 'number' && s.hour >= 0 && s.hour <= 23 ? s.hour : 13,
    timeLabel: formatHour(typeof s.hour === 'number' ? s.hour : 13),
    views: 0,
    share: typeof s.share === 'number' && s.share >= 0 && s.share <= 100 ? s.share : 75,
  }));

  const top = slots[0] || { day: bestDays[0], hour: bestHours[0], share: 75 };
  const summary =
    aiResult.summary ||
    `${pageName} ke liye: ${bestDays.slice(0, 3).join(', ')} ko ${bestHours.map(formatHour).join(', ')} pe post karein.`;

  return NextResponse.json({
    bestSlots: slots.length ? slots : [{ day: top.day, hour: top.hour, timeLabel: formatHour(top.hour), views: 0, share: top.share }],
    bestDays,
    bestHours,
    summary,
    totalVideosAnalyzed: 0,
  });
}
