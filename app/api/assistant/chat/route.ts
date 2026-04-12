export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { askSecureChatbot } from '@/lib/secureChatbot';
import { getClientIP, rateLimit } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = getClientIP(request);
    const limiter = rateLimit(`assistant-chat:${user.id}:${ip}`, 50, 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const secured = await askSecureChatbot({
      botName: 'VidYT Assistant',
      question: message,
      plan: user.subscription || 'free',
      functions: ['dashboard_help', 'plan_usage_help', 'youtube_tools_guidance', 'feature_navigation'],
      behaviorPrompt:
        'Reply in concise Hinglish. Focus on user plan, feature usage, and practical next steps. Never reveal admin/system secrets.',
      localFallback:
        'Main dashboard, plan limits, aur features use karne me help kar sakta hoon. Aap specific tool ya issue batao, main step-by-step guide dunga.',
    });

    return NextResponse.json({
      success: true,
      reply: secured.reply,
      provider: secured.provider,
      tier: secured.tier,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Assistant failed' }, { status: 500 });
  }
}
