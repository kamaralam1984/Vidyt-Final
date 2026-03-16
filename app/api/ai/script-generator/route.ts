import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import AIScript from '@/models/AIScript';
import { generateScript } from '@/services/ai/aiStudio';

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const mode = (url.searchParams.get('mode') || '').toLowerCase();
  const featureKey =
    mode === 'ideas' ? 'daily_ideas' : mode === 'coach' ? 'ai_coach' : 'script_writer';

  const access = await requireAIToolAccess(request, featureKey);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  try {
    const body = await request.json();
    const { topic, platform, duration, language } = body;
    if (!topic?.trim()) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    const result = await generateScript({
      topic: topic.trim(),
      platform: (platform || 'YouTube').trim(),
      duration: (duration || '5 min').trim(),
      language: (language || 'English').trim(),
    });
    await connectDB();
    await AIScript.create({
      userId: access.userId,
      topic: topic.trim(),
      platform: platform || 'YouTube',
      duration: duration || '5 min',
      language: language || 'English',
      hooks: result.hooks,
      script: result.script,
      titles: result.titles,
      hashtags: result.hashtags,
      cta: result.cta,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
