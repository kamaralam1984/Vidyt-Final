import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getApiConfig } from '@/lib/apiConfig';

function scoreTitleLength(title: string): number {
  const len = (title || '').trim().length;
  if (len >= 40 && len <= 70) return 100;
  if (len >= 30 && len < 40) return 85;
  if (len > 70 && len <= 100) return 75;
  if (len > 20 && len < 30) return 70;
  if (len >= 10 && len <= 20) return 60;
  if (len < 10) return 40;
  return 50;
}

function scoreKeywordUsage(title: string, description: string, keywords: string[]): number {
  const combined = `${(title || '').toLowerCase()} ${(description || '').toLowerCase()}`;
  const words = combined.split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return 50;
  let matches = 0;
  for (const kw of keywords) {
    const term = kw.toLowerCase().trim();
    if (!term) continue;
    if (words.some(w => w.includes(term) || term.includes(w))) matches++;
  }
  const ratio = keywords.length > 0 ? matches / Math.min(keywords.length, 10) : 0;
  return Math.min(100, Math.round(50 + ratio * 50));
}

function scoreDescription(description: string): number {
  const len = (description || '').trim().length;
  if (len >= 200 && len <= 500) return 100;
  if (len >= 100 && len < 200) return 85;
  if (len >= 50 && len < 100) return 70;
  if (len < 50) return 50;
  return 90;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { default: FeatureAccess } = await import('@/models/FeatureAccess');
    const doc = (await FeatureAccess.findOne({ feature: 'optimize' }).lean()) as
      | { allowedRoles?: string[] }
      | null;
    const roles = doc?.allowedRoles?.length ? doc.allowedRoles : ['manager', 'admin', 'super-admin'];
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Optimize tool is not enabled for your role. Contact Super Admin.' },
        { status: 403 }
      );
    }
  } catch {
    if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '';
  const description = searchParams.get('description') || '';
  const keywordsParam = searchParams.get('keywords') || '';
  const category = searchParams.get('category') || '';
  const keywords = keywordsParam.split(/[,;\n]/).map(k => k.trim()).filter(Boolean);

  const hasAnyInput = title.length > 0 || description.length > 0 || keywords.length > 0;
  if (!hasAnyInput) {
    return NextResponse.json({
      seoScore: 0,
      breakdown: {
        titleLength: { score: 0, label: 'Title dalen' },
        keywordUsage: { score: 0, label: 'Keywords dalen' },
        description: { score: 0, label: 'Description dalen' },
        category: { score: 0, label: 'Category optional' },
        thumbnail: { score: 0, label: 'Thumbnail optional' },
      },
    });
  }

  const titleScore = scoreTitleLength(title);
  const keywordScore = scoreKeywordUsage(title, description, keywords);
  const descScore = scoreDescription(description);
  const categoryScore = category ? 85 : 50;
  const thumbnailScore = 70;

  const weights = { title: 0.25, keyword: 0.25, description: 0.2, category: 0.15, thumbnail: 0.15 };
  const seoScore = Math.round(
    titleScore * weights.title +
    keywordScore * weights.keyword +
    descScore * weights.description +
    categoryScore * weights.category +
    thumbnailScore * weights.thumbnail
  );

  return NextResponse.json({
    seoScore: Math.min(100, Math.max(0, seoScore)),
    breakdown: {
      titleLength: { score: titleScore, label: title.length <= 70 ? 'Good' : 'Too long' },
      keywordUsage: { score: keywordScore, label: keywordScore >= 70 ? 'Good' : 'Add keywords' },
      description: { score: descScore, label: descScore >= 70 ? 'Good' : 'Expand description' },
      category: { score: categoryScore, label: category ? 'Set' : 'Not set' },
      thumbnail: { score: thumbnailScore, label: 'Default' },
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { default: FeatureAccess } = await import('@/models/FeatureAccess');
    const doc = (await FeatureAccess.findOne({ feature: 'optimize' }).lean()) as
      | { allowedRoles?: string[] }
      | null;
    const roles = doc?.allowedRoles?.length ? doc.allowedRoles : ['manager', 'admin', 'super-admin'];
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Optimize tool is not enabled for your role. Contact Super Admin.' },
        { status: 403 }
      );
    }
  } catch {
    if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const keywords: string[] = Array.isArray(body.keywords) ? body.keywords : (body.keywords || '').split(/[,;\n]/).map((k: string) => k.trim()).filter(Boolean);
  const category = (body.category || '').trim();
  const thumbnailScore = typeof body.thumbnailScore === 'number' ? body.thumbnailScore : 70;

  const hasAnyInput = title.length > 0 || description.length > 0 || keywords.length > 0;
  if (!hasAnyInput) {
    return NextResponse.json({
      seoScore: 0,
      breakdown: {
        titleLength: { score: 0, label: 'Title dalen' },
        keywordUsage: { score: 0, label: 'Keywords dalen' },
        description: { score: 0, label: 'Description dalen' },
        category: { score: 0, label: 'Category optional' },
        thumbnail: { score: 0, label: 'Thumbnail optional' },
      },
    });
  }

  const titleScore = scoreTitleLength(title);
  const keywordScore = scoreKeywordUsage(title, description, keywords);
  const descScore = scoreDescription(description);
  const categoryScore = category ? 85 : 50;

  const weights = { title: 0.25, keyword: 0.25, description: 0.2, category: 0.15, thumbnail: 0.15 };
  const seoScore = Math.round(
    titleScore * weights.title +
    keywordScore * weights.keyword +
    descScore * weights.description +
    categoryScore * weights.category +
    thumbnailScore * weights.thumbnail
  );

  return NextResponse.json({
    seoScore: Math.min(100, Math.max(0, seoScore)),
    breakdown: {
      titleLength: { score: titleScore, label: title.length <= 70 ? 'Good' : 'Too long' },
      keywordUsage: { score: keywordScore, label: keywordScore >= 70 ? 'Good' : 'Add keywords' },
      description: { score: descScore, label: descScore >= 70 ? 'Good' : 'Expand description' },
      category: { score: categoryScore, label: category ? 'Set' : 'Not set' },
      thumbnail: { score: thumbnailScore, label: thumbnailScore >= 70 ? 'Good' : 'Upload thumbnail' },
    },
  });
}
