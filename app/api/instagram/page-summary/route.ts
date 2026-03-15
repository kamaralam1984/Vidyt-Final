import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

function extractProfileIdentifier(url: string): string | null {
  const u = url.trim().toLowerCase();
  if (!u.includes('instagram.com')) return null;
  try {
    const clean = u.replace(/^https?:\/\//, '').split('/').filter(Boolean);
    const host = clean[0];
    const slug = clean[1];
    if ((host === 'instagram.com' || host === 'www.instagram.com') && slug && !['p', 'reel', 'reels', 'stories', 'tv', 'explore', 'direct', 'accounts'].includes(slug))
      return slug.replace(/[^a-z0-9._]/gi, '');
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
  const growthActions: { where: string; action: string; reason: string }[] = [
    { where: 'Bio', action: 'Bio me description, keywords aur 1 link likhein (150 chars tak)', reason: 'Profile visit pe samajh aaye aap kya karte hain' },
    { where: 'Profile Photo', action: 'Clear profile picture (face ya logo) set karein', reason: 'Recognition aur trust' },
    { where: 'Posting Schedule', action: 'Regular post karein — reels 3–5/week, posts bhi', reason: 'Algorithm aur followers dono ko consistency pasand hai' },
    { where: 'Reels', action: 'Reels zyada banayein — explore pe zyada reach milti hai', reason: 'Instagram reels ko priority deta hai' },
    { where: 'Hashtags', action: 'Har post/caption me 5–15 relevant hashtags use karein', reason: 'Discoverability badhti hai' },
    { where: 'Call to Action', action: 'Caption me "Follow karein", "Comment me bataen" jaisa CTA add karein', reason: 'Engagement badhne se reach' },
  ];
  const homepageKeywords: { keyword: string; score: number }[] = [
    { keyword: 'instagram', score: 85 },
    { keyword: 'reels', score: 82 },
    { keyword: 'viral', score: 78 },
    { keyword: 'trending', score: 75 },
    { keyword: 'follow', score: 72 },
    { keyword: 'explore', score: 70 },
  ];
  const recommendedKeywords: { keyword: string; score: number }[] = [
    { keyword: 'viral', score: 80 },
    { keyword: 'reels', score: 78 },
    { keyword: 'trending', score: 76 },
    { keyword: 'instagram', score: 85 },
    { keyword: 'follow', score: 72 },
    { keyword: 'explore', score: 70 },
    { keyword: 'like', score: 68 },
    { keyword: 'comment', score: 66 },
  ];

  const res = NextResponse.json({
    profileName,
    profileSlug: slug,
    followersCount: 0,
    postsCount: 0,
    profileDescription: '',
    profileKami: [] as string[],
    settingKami: ['Profile link save ho gaya. Instagram Graph API set karein to followers, posts count aur detailed audit milega.'],
    homepageKeywords,
    growthActions,
    recommendedKeywords,
    linked: true,
  });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}
