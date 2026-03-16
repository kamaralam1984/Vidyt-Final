import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

function extractBasesFromTitleAndKeyword(title: string, keyword: string): string[] {
  const bases: string[] = [];
  const titleWords = (title || '').toLowerCase().trim().split(/\s+/).filter(w => w.length > 1);
  const keywordWords = (keyword || '').toLowerCase().trim().split(/[,;\s]+/).map(k => k.trim()).filter(Boolean);

  if (titleWords.length >= 2) {
    bases.push(titleWords.slice(0, 2).join(' '));
    if (titleWords.length >= 4) bases.push(titleWords.slice(2, 4).join(' '));
    if (titleWords.length >= 3) bases.push(titleWords.slice(0, 3).join(' '));
    bases.push(titleWords.join(' ').slice(0, 30).trim());
  } else if (titleWords.length === 1) bases.push(titleWords[0]);

  keywordWords.forEach(kw => {
    const w = kw.split(/\s+/).slice(0, 3).join(' ');
    if (w && !bases.includes(w)) bases.push(w);
  });

  if (bases.length === 0) bases.push('youtube viral', 'viral tips', 'content growth');
  return [...new Set(bases)];
}

function buildViralKeywords(title: string, keyword: string): { keyword: string; viralScore: number }[] {
  const bases = extractBasesFromTitleAndKeyword(title, keyword);
  const suffixes = [
    ' tips', ' tutorial', ' 2025', ' for beginners', ' strategy', ' growth', ' hack',
    ' how to', ' best', ' viral', ' algorithm', ' secrets', ' guide', ' tricks', ' ideas',
    ' vs', ' explained', ' full', ' real', ' easy', ' fast', ' free', ' proven', ' expert',
    ' complete', ' step by step', ' master', ' success', ' trending', ' shorts', ' youtube',
  ];
  const prefixes = ['', 'how to ', 'best ', 'top ', 'ultimate ', 'secret ', 'viral ', 'easy ', 'full '];
  const out: { keyword: string; viralScore: number }[] = [];
  const seen = new Set<string>();

  for (let bi = 0; bi < bases.length; bi++) {
    const b = bases[bi].replace(/\s+/g, ' ').trim() || 'viral';
    for (let pi = 0; pi < prefixes.length; pi++) {
      const p = prefixes[pi];
      for (let si = 0; si < suffixes.length; si++) {
        const s = suffixes[si];
        let kw = (p + b + s).replace(/\s+/g, ' ').trim();
        if (kw.length < 3) continue;
        if (seen.has(kw)) continue;
        seen.add(kw);
        const viralScore = 45 + Math.floor(Math.random() * 50);
        out.push({ keyword: kw, viralScore });
        if (out.length >= 100) break;
      }
      if (out.length >= 100) break;
    }
    if (out.length >= 100) break;
  }

  while (out.length < 100 && bases[0]) {
    const b = bases[0];
    const extra = [`${b} video`, `${b} channel`, `${b} content`, `${b} ideas`, `learn ${b}`, `get ${b}`, `${b} 2025`, `${b} for free`, `${b} tutorial hindi`, `${b} full guide`];
    for (const kw of extra) {
      if (seen.has(kw)) continue;
      seen.add(kw);
      out.push({ keyword: kw, viralScore: 50 + Math.floor(Math.random() * 45) });
      if (out.length >= 100) break;
    }
    break;
  }

  return out.slice(0, 100).sort((a, b) => b.viralScore - a.viralScore);
}

function mockKeywordAnalysis(keyword: string) {
  const len = keyword.length;
  const searchVolume = len > 15 ? 'Low' : len > 8 ? 'Medium' : 'High';
  const competition = len > 12 ? 'Low' : len > 6 ? 'Medium' : 'High';
  const seoScore = Math.min(95, 50 + Math.floor(Math.random() * 45));
  return { searchVolume, competition, seoScore };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // per-tool feature flag: Keyword Research
  try {
    const { default: FeatureAccess } = await import('@/models/FeatureAccess');
    const doc = (await FeatureAccess.findOne({ feature: 'keyword_research' }).lean()) as
      | { allowedRoles?: string[] }
      | null;
    const roles = doc?.allowedRoles?.length ? doc.allowedRoles : ['manager', 'admin', 'super-admin'];
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Keyword Research tool is not enabled for your role. Contact Super Admin.' },
        { status: 403 }
      );
    }
  } catch {
    // if check fails, fall back to existing behavior (no extra block)
  }
  if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('keyword') || '').trim();
  const title = (searchParams.get('title') || '').trim();

  const viralKeywords = buildViralKeywords(title, keyword);
  const analysis = keyword ? mockKeywordAnalysis(keyword) : null;

  return NextResponse.json({
    keyword: keyword || null,
    analysis: analysis ? {
      searchVolume: analysis.searchVolume,
      competition: analysis.competition,
      seoScore: analysis.seoScore,
    } : null,
    viralKeywords,
  });
}
