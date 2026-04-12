export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';

type ViralLevel = 'high' | 'medium' | 'low';
type ContentType = 'video' | 'short' | 'live';

function buildViralHashtags(seed: string, _contentType: ContentType = 'video'): { tag: string; viralLevel: ViralLevel; viralScore: number }[] {
  const k = (seed || '').toLowerCase().trim().replace(/\s+/g, '');
  const base = k || 'viral';
  const globalTags = [
    '#shorts', '#viral', '#youtube', '#trending', '#fyp', '#explore', '#viralvideo', '#youtubeshorts',
    '#tips', '#growth', '#2025', '#subscribe', '#like', '#comment', '#content', '#creator',
    '#algorithm', '#views', '#youtuber', '#video', '#new', '#top', '#best', '#howto', '#tutorial',
  ];
  const custom = base ? [`#${base}`, `#${base}Tips`, `#${base}2025`, `#${base}Viral`, `#${base}Growth`] : [];
  const combined = [...custom, ...globalTags].slice(0, 25);
  const levels: ViralLevel[] = ['high', 'medium', 'low'];
  return combined.map((tag, i) => {
    const level = levels[i % 3] as ViralLevel;
    const viralScore = level === 'high' ? 75 + Math.floor(Math.random() * 21) : level === 'medium' ? 50 + Math.floor(Math.random() * 25) : 25 + Math.floor(Math.random() * 25);
    return { tag, viralLevel: level, viralScore };
  });
}

export async function GET(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'youtube_seo');
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('keyword') || '').trim();
  const contentType = (searchParams.get('contentType') || 'video') as ContentType;

  const hashtags = buildViralHashtags(keyword, contentType);
  return NextResponse.json({ hashtags });
}
