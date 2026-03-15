import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

function scoreTitleLength(title: string): number {
  const len = (title || '').trim().length;
  if (len >= 30 && len <= 100) return 100;
  if (len >= 20 && len < 30) return 85;
  if (len > 100 && len <= 150) return 75;
  if (len >= 10 && len < 20) return 70;
  if (len < 10) return 40;
  return 50;
}

function scoreKeywordUsage(title: string, description: string, keywords: string[]): number {
  const combined = `${(title || '').toLowerCase()} ${(description || '').toLowerCase()}`;
  if (keywords.length === 0) return 50;
  let matches = 0;
  for (const kw of keywords) {
    const term = kw.toLowerCase().trim();
    if (!term) continue;
    if (combined.includes(term)) matches++;
  }
  const ratio = keywords.length > 0 ? matches / Math.min(keywords.length, 10) : 0;
  return Math.min(100, Math.round(50 + ratio * 50));
}

function scoreDescription(description: string): number {
  const len = (description || '').trim().length;
  if (len >= 150 && len <= 500) return 100;
  if (len >= 80 && len < 150) return 85;
  if (len >= 30 && len < 80) return 70;
  if (len < 30) return 50;
  return 90;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '';
  const description = searchParams.get('description') || '';
  const keywordsParam = searchParams.get('keywords') || '';
  const keywords = keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

  const titleScore = scoreTitleLength(title);
  const keywordScore = scoreKeywordUsage(title, description, keywords);
  const descScore = scoreDescription(description);
  const thumbnailScore = 70;

  const weights = { title: 0.3, keyword: 0.3, description: 0.3, thumbnail: 0.1 };
  const seoScore = Math.round(
    titleScore * weights.title +
    keywordScore * weights.keyword +
    descScore * weights.description +
    thumbnailScore * weights.thumbnail
  );

  return NextResponse.json({
    seoScore: Math.min(100, Math.max(0, seoScore)),
    breakdown: {
      titleLength: { score: titleScore, label: title.length <= 100 ? 'Good' : 'Too long' },
      keywordUsage: { score: keywordScore, label: keywordScore >= 70 ? 'Good' : 'Add keywords' },
      description: { score: descScore, label: descScore >= 70 ? 'Good' : 'Expand description' },
      thumbnail: { score: thumbnailScore, label: 'Default' },
    },
  });
}
