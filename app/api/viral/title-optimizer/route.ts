import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

function scoreTitleForCtr(t: string): number {
  if (!t?.trim()) return 5;
  const s = t.trim();
  let score = 5;
  if (/\d+/.test(s)) score += 1.2;
  if (/\?|how|what|why|when|which/i.test(s)) score += 1.5;
  if (/[\[\(]/.test(s)) score += 0.8;
  const len = Math.min(60, s.length);
  score += Math.min(2, len / 30);
  return Math.min(14, Math.round(score * 10) / 10);
}

function generateTitles(title: string, keywords: string[]): { title: string; predictedCtr: number }[] {
  const base = title.trim() || 'Your Video';
  const kw = keywords.slice(0, 5);
  const year = new Date().getFullYear();
  const templates = [
    base,
    `How to ${base} (${year})`,
    `${base} | Step by Step`,
    `The Ultimate Guide to ${base}`,
    `${base} - Tips That Actually Work`,
  ];
  const withKw = kw[0] ? [
    `${base} - ${kw[0]}`,
    `Best ${kw[0]} Tips: ${base}`,
  ] : [];
  const all = [...templates, ...withKw].slice(0, 5);
  return all.map((t) => {
    const full = t.length > 100 ? t.slice(0, 97) + '...' : t;
    const predictedCtr = scoreTitleForCtr(full);
    return { title: full, predictedCtr };
  }).sort((a, b) => b.predictedCtr - a.predictedCtr);
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const title = (body.title as string)?.trim() || '';
    const keywordsStr = (body.keywords as string) || '';
    const keywords = keywordsStr.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

    const titles = generateTitles(title, keywords);
    const recommendedIndex = 0;

    return NextResponse.json({
      titles: titles.map((t, i) => ({
        ...t,
        recommended: i === recommendedIndex,
      })),
    });
  } catch (e) {
    console.error('Title optimizer API error:', e);
    return NextResponse.json(
      { titles: [{ title: 'Your Video', predictedCtr: 7, recommended: true }] },
      { status: 500 }
    );
  }
}
