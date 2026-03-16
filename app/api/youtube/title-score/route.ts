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
