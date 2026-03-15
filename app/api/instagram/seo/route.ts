import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

function scoreCaptionLength(caption: string): number {
  const len = (caption || '').trim().length;
  if (len >= 100 && len <= 500) return 100;
  if (len >= 50 && len < 100) return 85;
  if (len >= 30 && len < 50) return 75;
  if (len >= 15 && len < 30) return 65;
  if (len < 15) return 45;
  return 90;
}

function scoreKeywordUsage(caption: string, keywords: string[]): number {
  const lower = (caption || '').toLowerCase();
  if (keywords.length === 0) return 50;
  let matches = 0;
  for (const kw of keywords) {
    if (!kw.trim()) continue;
    if (lower.includes(kw.toLowerCase().trim())) matches++;
  }
  const ratio = matches / Math.min(keywords.length, 10);
  return Math.min(100, Math.round(50 + ratio * 50));
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const caption = searchParams.get('caption') || searchParams.get('title') || '';
  const keywordsParam = searchParams.get('keywords') || '';
  const keywords = keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

  const captionScore = scoreCaptionLength(caption);
  const keywordScore = scoreKeywordUsage(caption, keywords);
  const weights = { caption: 0.5, keyword: 0.5 };
  const seoScore = Math.round(captionScore * weights.caption + keywordScore * weights.keyword);

  return NextResponse.json({
    seoScore: Math.min(100, Math.max(0, seoScore)),
    breakdown: {
      captionLength: { score: captionScore, label: caption.length <= 500 ? 'Good' : 'Too long' },
      keywordUsage: { score: keywordScore, label: keywordScore >= 70 ? 'Good' : 'Add keywords' },
    },
  });
}
