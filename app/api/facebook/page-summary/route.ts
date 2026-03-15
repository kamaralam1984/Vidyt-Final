import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

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
  const pageKami: string[] = [];
  const settingKami: string[] = [];
  const growthActions: { where: string; action: string; reason: string }[] = [
    { where: 'Page About', action: 'About section me page description, keywords aur contact details likhein', reason: 'Log samajh sake page kya hai, follow kyun karein' },
    { where: 'Cover Photo', action: 'Cover image set karein (820x312) — brand ya main message', reason: 'First impression strong hota hai' },
    { where: 'Profile Photo', action: 'Clear profile picture (logo ya face) set karein', reason: 'Recognition aur trust' },
    { where: 'Posting Schedule', action: 'Regular post karein — reels/shorts 1–2 roz, posts bhi', reason: 'Algorithm aur followers dono ko consistency pasand hai' },
    { where: 'Reels / Video', action: 'Reels aur video zyada share karein — engagement badhti hai', reason: 'Facebook reels ko zyada reach deta hai' },
    { where: 'Call to Action', action: 'Post me "Follow karein", "Share karein", "Comment me bataen" jaisa CTA add karein', reason: 'Engagement badhne se reach aur growth' },
  ];
  const homepageKeywords: { keyword: string; score: number }[] = [
    { keyword: 'facebook', score: 85 },
    { keyword: 'viral', score: 78 },
    { keyword: 'reels', score: 82 },
    { keyword: 'trending', score: 75 },
    { keyword: 'follow', score: 70 },
    { keyword: 'page', score: 65 },
  ];
  const recommendedKeywords: { keyword: string; score: number }[] = [
    { keyword: 'viral', score: 80 },
    { keyword: 'reels', score: 78 },
    { keyword: 'trending', score: 76 },
    { keyword: 'facebook', score: 85 },
    { keyword: 'follow', score: 72 },
    { keyword: 'share', score: 70 },
    { keyword: 'like', score: 68 },
    { keyword: 'comment', score: 66 },
  ];

  const res = NextResponse.json({
    pageName,
    pageSlug: parsed.slug,
    isProfile: parsed.isProfile,
    followersCount: 0,
    postsCount: 0,
    pageDescription: '',
    pageKami,
    settingKami: settingKami.length ? settingKami : ['Page link save ho gaya. Facebook Graph API set karein to followers, posts count aur detailed audit milega.'],
    homepageKeywords,
    growthActions,
    recommendedKeywords,
    linked: true,
  });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}
