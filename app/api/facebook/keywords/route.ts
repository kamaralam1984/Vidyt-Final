export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

function extractBases(title: string, keyword: string): string[] {
  const titleWords = (title || '').toLowerCase().trim().split(/\s+/).filter((w) => w.length > 1);
  const keywordWords = (keyword || '').toLowerCase().trim().split(/[,;\s]+/).map((k) => k.trim()).filter(Boolean);
  const bases: string[] = [];
  if (titleWords.length >= 2) bases.push(titleWords.slice(0, 2).join(' '));
  if (titleWords.length >= 1) bases.push(titleWords[0]);
  keywordWords.forEach((kw) => { const w = kw.split(/\s+/).slice(0, 2).join(' '); if (w && !bases.includes(w)) bases.push(w); });
  if (bases.length === 0) bases.push('viral', 'facebook', 'trending');
  return [...new Set(bases)];
}

function buildViralKeywords(title: string, keyword: string): { keyword: string; viralScore: number }[] {
  const bases = extractBases(title, keyword);
  const suffixes = [' tips', ' viral', ' reels', ' 2025', ' growth', ' strategy', ' hack', ' guide', ' trending', ' content', ' facebook'];
  const out: { keyword: string; viralScore: number }[] = [];
  const seen = new Set<string>();
  for (const b of bases) {
    const base = b.replace(/\s+/g, ' ').trim() || 'viral';
    for (const s of suffixes) {
      const kw = (base + s).replace(/\s+/g, ' ').trim();
      if (kw.length < 3 || seen.has(kw)) continue;
      seen.add(kw);
      out.push({ keyword: kw, viralScore: 50 + (out.length % 45) });
      if (out.length >= 50) break;
    }
    if (out.length >= 50) break;
  }
  return out.slice(0, 50).sort((a, b) => b.viralScore - a.viralScore);
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('keyword') || '').trim();
  const title = (searchParams.get('title') || '').trim();

  const viralKeywords = buildViralKeywords(title, keyword);
  return NextResponse.json({
    keyword: keyword || null,
    viralKeywords,
  });
}
