export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { recordInteraction } from '@/services/ai/adaptiveLearning';

/**
 * POST /api/learn/track
 * Records a user action (hook copy, keyword copy, etc.) for the learning engine.
 * Lightweight — fire-and-forget from the frontend.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      sessionId, topic, niche, platform, language, region,
      interactionType, content, contentIndex, hookStyle,
    } = body;

    if (!sessionId || !interactionType || !content || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Record asynchronously — do not await to keep response instant
    recordInteraction({
      userId: user.id,
      sessionId,
      topic: topic || '',
      niche: niche || '',
      platform,
      language: language || 'english',
      region: region || 'india',
      interactionType,
      content: String(content).slice(0, 500), // cap length
      contentIndex: typeof contentIndex === 'number' ? contentIndex : 0,
      hookStyle,
    }).catch(() => { /* silent fail */ });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Track failed' }, { status: 500 });
  }
}
