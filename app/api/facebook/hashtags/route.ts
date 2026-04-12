export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

type ViralLevel = 'high' | 'medium' | 'low';
type ContentType = 'post' | 'reel' | 'live';

function buildHashtags(seed: string, contentType: ContentType): { tag: string; viralLevel: ViralLevel; viralScore: number }[] {
  const k = (seed || '').toLowerCase().trim().replace(/\s+/g, '');
  const base = k || 'viral';
  const custom = base ? [`#${base}`, `#${base}Tips`, `#${base}2025`, `#${base}Viral`] : [];
  const postTags = ['#facebook', '#viral', '#trending', '#reels', '#fyp', '#explore', '#like', '#share', '#comment', '#follow', '#content', '#creator', '#2025', '#viralvideo', '#trending', '#fbreels', '#facebookreels'];
  const reelTags = ['#facebookreels', '#reels', '#fbreels', '#viral', '#trending', '#fyp', '#explore', '#shortvideo', '#content', '#creator', '#2025', '#like', '#share', '#comment'];
  const liveTags = ['#live', '#facebooklive', '#livestream', '#livevideo', '#streaming', '#viral', '#facebook', '#trending', '#watch', '#comment', '#share', '#2025'];
  const globalTags = contentType === 'reel' ? reelTags : contentType === 'live' ? liveTags : postTags;
  const combined = [...custom, ...globalTags].slice(0, 25);
  const levels: ViralLevel[] = ['high', 'medium', 'low'];
  return combined.map((tag, i) => {
    const level = levels[i % 3] as ViralLevel;
    const viralScore = level === 'high' ? 75 + (i % 7) : level === 'medium' ? 50 + (i % 10) : 25 + (i % 15);
    return { tag, viralLevel: level, viralScore };
  });
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('keyword') || '').trim();
  const contentType = (searchParams.get('contentType') || 'post') as ContentType;

  const hashtags = buildHashtags(keyword, contentType);
  return NextResponse.json({ hashtags });
}
