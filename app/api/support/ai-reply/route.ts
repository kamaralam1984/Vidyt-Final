export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import Ticket from '@/models/Ticket';
import TicketReply from '@/models/TicketReply';
import PlatformControl from '@/models/PlatformControl';
import { analyzeAndDraftSupportReply } from '@/services/ai/supportAI';
import { rateLimit, getClientIP } from '@/lib/rateLimiter';

async function isAiSupportEnabled(plan: string) {
  const cfg = await PlatformControl.findOne({ platform: 'support' }).lean() as any;
  if (!cfg || cfg.isEnabled !== true) return false;
  const plans = Array.isArray(cfg.allowedPlans) ? cfg.allowedPlans : [];
  if (!plans.includes(plan)) return false;
  const features = cfg.features || {};
  const flag = features.ai_auto_reply ?? features.get?.('ai_auto_reply');
  return !!flag;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(auth.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const ip = getClientIP(req);
    const limiter = rateLimit(`support-ai-reply:${auth.id}:${ip}`, 30, 60 * 1000);
    if (!limiter.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    const ticketId = String(body.ticketId || '');
    const fallbackSubject = String(body.subject || 'Support request');
    const fallbackMessage = String(body.message || '');
    const autoReply = body.autoReply !== false;
    const confidenceThreshold = Number(body.confidenceThreshold ?? 0.75);

    let ticket: any = null;
    if (ticketId) {
      ticket = await Ticket.findById(ticketId);
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      const isAdmin = user.role === 'admin' || user.role === 'super-admin';
      if (!isAdmin && ticket.userId.toString() !== String(user._id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const subject = ticket?.subject || fallbackSubject;
    const message = ticket?.message || fallbackMessage;
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const plan = String(user.subscription || 'free');
    const enabled = await isAiSupportEnabled(plan);
    if (!enabled) {
      return NextResponse.json({ error: 'AI support auto-reply is disabled' }, { status: 400 });
    }

    const ai = await analyzeAndDraftSupportReply({
      subject,
      message,
      userPlan: plan,
      confidenceThreshold,
    });

    if (ticket) {
      ticket.category = ai.category;
      ticket.aiConfidence = ai.confidence;
      ticket.aiAutoReplied = autoReply && ai.shouldAutoReply;
      ticket.assignedToAdmin = !ai.shouldAutoReply;
      if (autoReply && ai.shouldAutoReply) {
        await TicketReply.create({
          ticketId: ticket._id,
          sender: 'ai',
          message: ai.aiReply,
          tokenUsage: ai.tokenUsage || undefined,
        });
        ticket.aiLastReplyAt = new Date();
      }
      await ticket.save();
    }

    return NextResponse.json({
      success: true,
      category: ai.category,
      confidence: ai.confidence,
      shouldAutoReply: ai.shouldAutoReply,
      reply: ai.aiReply,
      ticketId: ticket?._id?.toString() || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'AI support reply failed' }, { status: 500 });
  }
}
