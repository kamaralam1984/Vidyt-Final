import { NextRequest, NextResponse } from 'next/server';
import { requireAIStudioAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import AIHook from '@/models/AIHook';
import { generateHooks } from '@/services/ai/aiStudio';

export async function POST(request: NextRequest) {
  const access = await requireAIStudioAccess(request);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  try {
    const body = await request.json();
    const { topic, niche, platform } = body;
    if (!topic?.trim()) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    const result = await generateHooks({
      topic: topic.trim(),
      niche: (niche || '').trim(),
      platform: (platform || 'YouTube').trim(),
    });
    await connectDB();
    await AIHook.create({
      userId: access.userId,
      topic: topic.trim(),
      niche: niche || '',
      platform: platform || 'YouTube',
      hooks: result.hooks,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
