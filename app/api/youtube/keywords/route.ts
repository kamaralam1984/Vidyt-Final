export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { seedSeoPages } from '@/lib/seedSeoPages';

function extractBasesFromTitleAndKeyword(title: string, keyword: string): string[] {
  const bases: string[] = [];
  const titleWords = (title || '').toLowerCase().trim().split(/\s+/).filter(w => w.length > 1);
  const keywordWords = (keyword || '').toLowerCase().trim().split(/[,;\s]+/).map(k => k.trim()).filter(Boolean);

  if (titleWords.length >= 2) {
    bases.push(titleWords.slice(0, 2).join(' '));
    if (titleWords.length >= 4) bases.push(titleWords.slice(2, 4).join(' '));
    // Max 3 words per base — longer bases + suffixes = garbage keywords
    if (titleWords.length >= 3) bases.push(titleWords.slice(0, 3).join(' '));
  } else if (titleWords.length === 1) bases.push(titleWords[0]);

  // Only take first 3 words of keyword input
  keywordWords.slice(0, 3).forEach(kw => {
    const w = kw.split(/\s+/).slice(0, 3).join(' ');
    if (w && !bases.includes(w)) bases.push(w);
  });

  if (bases.length === 0) bases.push('youtube viral', 'viral tips', 'content growth');
  return [...new Set(bases)];
}

function buildViralKeywords(title: string, keyword: string): { keyword: string; viralScore: number }[] {
  const bases = extractBasesFromTitleAndKeyword(title, keyword);
  // Suffixes / prefixes ko zyada generic content-creator se hata kar
  // aise terms rakhe gaye hain jo kisi bhi topic ke saath natural lagen
  // (story, episode, shorts, viral video, etc.).
  const suffixes = [
    '',
    ' story',
    ' full story',
    ' short video',
    ' shorts',
    ' viral video',
    ' new video',
    ' drama',
    ' comedy',
    ' scene',
    ' episode',
    ' full episode',
    ' part 1',
    ' part 2',
    ' emotional',
    ' funny',
    ' vlog',
    ' hindi',
    ' in hindi',
    ' trending',
    ' 2026',
  ];
  const prefixes = ['', 'new ', 'best ', 'top ', 'viral '];
  const out: { keyword: string; viralScore: number }[] = [];
  const seen = new Set<string>();

  for (let bi = 0; bi < bases.length; bi++) {
    const b = bases[bi].replace(/\s+/g, ' ').trim() || 'viral';
    for (let pi = 0; pi < prefixes.length; pi++) {
      const p = prefixes[pi];
      for (let si = 0; si < suffixes.length; si++) {
        const s = suffixes[si];
        let kw = (p + b + s).replace(/\s+/g, ' ').trim();
        if (kw.length < 3 || kw.length > 60) continue;
        // Skip if any word repeats (e.g. "tutorial tutorial")
        const kwWords = kw.split(' ');
        if (new Set(kwWords).size < kwWords.length) continue;
        if (seen.has(kw)) continue;
        const hash = kw.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const viralScore = 45 + (hash % 50);
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
      const hash = kw.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      out.push({ keyword: kw, viralScore: 50 + (hash % 45) });
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
  const hash = keyword.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const seoScore = Math.min(95, 50 + (hash % 45));
  return { searchVolume, competition, seoScore };
}

export async function GET(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'youtube_seo');
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('keyword') || '').trim();
  const title = (searchParams.get('title') || '').trim();

  const viralKeywords = buildViralKeywords(title, keyword);
  const analysis = keyword ? mockKeywordAnalysis(keyword) : null;

  // Fire-and-forget: auto-create SEO pages for searched keyword + all viral variations
  // Each page becomes a Google-indexable /k/[keyword] URL — grows organic traffic silently
  if (keyword || title) {
    const allKeywords = [
      keyword,
      title,
      ...viralKeywords.slice(0, 40).map(k => k.keyword), // top 40 viral variants
    ].filter(Boolean) as string[];
    seedSeoPages(allKeywords);
  }

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
