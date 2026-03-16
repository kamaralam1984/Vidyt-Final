import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
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
  const k = (keyword || title || 'content').trim();
  const base = k.split(/\s+/).slice(0, 3).join(' ');
  const year = new Date().getFullYear();
  const titles = [
    `How to Go Viral with ${base} (${year})`,
    `3 ${base} Tricks That Actually Work`,
    `${base} Strategy That Gets Views`,
    `The Best ${base} Guide for Beginners`,
    `${base}: What Nobody Tells You`,
  ];
  return titles.map((t, i) => ({ title: t, score: 95 - i * 4 }));
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { default: FeatureAccess } = await import('@/models/FeatureAccess');
    const doc = (await FeatureAccess.findOne({ feature: 'title_generator' }).lean()) as
      | { allowedRoles?: string[] }
      | null;
    const roles = doc?.allowedRoles?.length ? doc.allowedRoles : ['manager', 'admin', 'super-admin'];
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Title Generator tool is not enabled for your role. Contact Super Admin.' },
        { status: 403 }
      );
    }
  } catch {
    if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { default: FeatureAccess } = await import('@/models/FeatureAccess');
    const doc = (await FeatureAccess.findOne({ feature: 'title_generator' }).lean()) as
      | { allowedRoles?: string[] }
      | null;
    const roles = doc?.allowedRoles?.length ? doc.allowedRoles : ['manager', 'admin', 'super-admin'];
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Title Generator tool is not enabled for your role. Contact Super Admin.' },
        { status: 403 }
      );
    }
  } catch {
    if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const title = (body.title || '').trim();
  const keyword = (body.keyword || '').trim();

  const titleScore = scoreTitle(title);
  return NextResponse.json({
    titleScore,
    improvedTitles: generateImprovedTitles(title, keyword),
  });
}
