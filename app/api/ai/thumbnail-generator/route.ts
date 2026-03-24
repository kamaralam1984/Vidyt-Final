export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import AIThumbnail from '@/models/AIThumbnail';
import { generateThumbnail } from '@/services/ai/aiStudio';

export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'ai_thumbnail_maker');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  try {
    const body = await request.json();
    const { videoTitle, topic, emotion, niche } = body;
    if (!videoTitle?.trim()) return NextResponse.json({ error: 'Video title is required' }, { status: 400 });
    const result = await generateThumbnail({
      videoTitle: videoTitle.trim(),
      topic: (topic || '').trim(),
      emotion: (emotion || 'curiosity').trim(),
      niche: (niche || '').trim(),
    });
    await connectDB();
    await AIThumbnail.create({
      userId: access.userId,
      videoTitle: videoTitle.trim(),
      topic: topic || '',
      emotion: emotion || 'curiosity',
      niche: niche || '',
      textSuggestions: result.textSuggestions,
      layoutIdea: result.layoutIdea,
      colorPalette: result.colorPalette,
      ctrScore: result.ctrScore,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
