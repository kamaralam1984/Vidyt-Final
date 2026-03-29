export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { getApiConfig } from '@/lib/apiConfig';

function scoreTitle(title: string): number {
  const t = (title || '').trim();
  const len = t.length;
  if (len >= 40 && len <= 70) return 95;
  if (len >= 30 && len < 40) return 88;
  if (len > 70 && len <= 100) return 75;
  if (len >= 20 && len < 30) return 80;
  if (len < 20) return 60;
  return 70;
}

function generateImprovedTitles(title: string, keyword: string): { title: string; score: number }[] {
  // Topic ko mix karne ke liye dono use kar rahe hain: keyword + current title
  const baseSource = (keyword || title || 'video').trim().replace(/\s+/g, ' ');
  const words = baseSource.split(' ');
  const shortBase = words.slice(0, 4).join(' ');
  const base = shortBase || baseSource;
  const year = new Date().getFullYear();

  const variants: string[] = [];

  // 1. Direct story / topic style
  variants.push(`${base} | Full Story`);
  variants.push(`${base} | Real Story in Hindi`);

  // 2. Viral / drama style
  variants.push(`Full ${base} Drama | Must Watch`);
  variants.push(`${base} | Emotional Story That Will Shock You`);

  // 3. Episode / part system
  variants.push(`${base} | Episode 1 (Hindi Story)`);

  return variants.map((t, i) => ({
    title: t,
    score: 95 - i * 3,
  }));
}

export async function GET(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'youtube_seo');
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || '').trim();
  const keyword = (searchParams.get('keyword') || '').trim();

  const titleScore = scoreTitle(title);
  return NextResponse.json({
    titleScore,
    improvedTitles: generateImprovedTitles(title, keyword),
  });
}

export async function POST(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'youtube_seo');
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const title = (body.title || '').trim();
  const keyword = (body.keyword || '').trim();

  const titleScore = scoreTitle(title);
  return NextResponse.json({
    titleScore,
    improvedTitles: generateImprovedTitles(title, keyword),
  });
}
