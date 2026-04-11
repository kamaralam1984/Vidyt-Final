export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { analyzeAndDraftSupportReply } from '@/services/ai/supportAI';
import connectDB from '@/lib/mongodb';
import ChatSession from '@/models/ChatSession';
import ChatMessage from '@/models/ChatMessage';
import User from '@/models/User';
import { getClientIP, rateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').trim();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    const ip = getClientIP(req);
    const limiter = rateLimit(`support-chat:${auth.id}:${ip}`, 40, 60 * 1000);
    if (!limiter.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    await connectDB();
    const userDoc = await User.findById(auth.id).select('subscription').lean() as { _id: any; subscription?: string } | null;
    if (!userDoc) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const existingSessionId = String(body.sessionId || '');
    let session: any = null;
    if (existingSessionId) {
      session = await ChatSession.findById(existingSessionId);
    }
    if (!session) {
      session = await ChatSession.findOne({
        userId: userDoc._id,
        channel: 'support',
        status: 'active',
      }).sort({ updatedAt: -1 });
    }
    if (!session) {
      session = await ChatSession.create({
        userId: userDoc._id,
        channel: 'support',
        status: 'active',
        title: 'Support Chat',
        lastMessageAt: new Date(),
      });
    }

    await ChatMessage.create({
      sessionId: session._id,
      userId: userDoc._id,
      role: 'user',
      content: message,
    });

    const ai = await analyzeAndDraftSupportReply({
      subject: 'Live support chat',
      message,
      userPlan: String(userDoc.subscription || 'free'),
      confidenceThreshold: 0,
    });

    await ChatMessage.create({
      sessionId: session._id,
      userId: userDoc._id,
      role: 'assistant',
      content: ai.aiReply,
      tokenUsage: ai.tokenUsage || undefined,
    });
    session.lastMessageAt = new Date();
    await session.save();

    return NextResponse.json({
      success: true,
      sessionId: String(session._id),
      category: ai.category,
      confidence: ai.confidence,
      reply: ai.aiReply,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Chat failed' }, { status: 500 });
  }
}
