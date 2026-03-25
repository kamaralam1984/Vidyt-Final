export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import TicketReply from '@/models/TicketReply';
import User from '@/models/User';
import PlatformControl from '@/models/PlatformControl';
import { getApiConfig } from '@/lib/apiConfig';
import { analyzeAndDraftSupportReply } from '@/services/ai/supportAI';
import { rateLimit, getClientIP } from '@/lib/rateLimiter';
import { enqueueAiJob } from '@/lib/queue';
import { logError } from '@/lib/observability';

export async function GET(req: NextRequest) {
    try {
        const authUser = await getUserFromRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findById(authUser.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const url = new URL(req.url);
        const page = Math.max(1, Number(url.searchParams.get('page') || 1));
        const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 20)));
        const skip = (page - 1) * limit;

        let query: Record<string, any> = {};
        if (user.role !== 'admin' && user.role !== 'super-admin') {
            query = { userId: user._id };
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Ticket.countDocuments(query),
        ]);
        return NextResponse.json({
            tickets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authUser = await getUserFromRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findById(authUser.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const ip = getClientIP(req);
        const limiter = rateLimit(`support-ticket:${authUser.id}:${ip}`, 20, 60 * 1000);
        if (!limiter.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 });
        }

        const { subject, message } = await req.json();
        if (!subject || !message) {
            return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
        }

        // Check Support Config Priorities
        const supportConfig = await PlatformControl.findOne({ platform: 'support' });
        
        let priority = 'normal';
        let plan = user.subscription || 'free';
        let isAiAllowed = false;

        if (supportConfig && supportConfig.isEnabled) {
            if (supportConfig.allowedPlans.includes(plan)) {
                // Feature checks
                isAiAllowed = !!supportConfig.features?.get('ai_auto_reply');
                if (supportConfig.features?.get('priority_support') && ['owner', 'enterprise'].includes(plan)) {
                    priority = 'high';
                }
            }
        }

        const ticket = await Ticket.create({
            userId: user._id,
            subject,
            message,
            priority,
            status: 'open'
        });

        // Add user initial message to replies
        await TicketReply.create({
            ticketId: ticket._id,
            sender: 'user',
            message
        });

        // Trigger AI auto-reply with AI category/confidence.
        if (isAiAllowed) {
            const apiConfig = await getApiConfig();
            if (apiConfig.openaiApiKey) {
                const ai = await analyzeAndDraftSupportReply({
                    apiKey: apiConfig.openaiApiKey,
                    subject,
                    message,
                    userPlan: plan,
                    confidenceThreshold: 0.75,
                });
                ticket.category = ai.category;
                ticket.aiConfidence = ai.confidence;
                ticket.aiAutoReplied = ai.shouldAutoReply;
                ticket.assignedToAdmin = !ai.shouldAutoReply;
                if (ai.shouldAutoReply && ai.aiReply) {
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
        }

        // Optional async processing in queue for production scale.
        if (process.env.AI_SUPPORT_QUEUE_ENABLED === 'true') {
            try {
                await enqueueAiJob({
                    jobType: 'support_ai',
                    userId: String(authUser.id),
                    data: { ticketId: String(ticket._id), confidenceThreshold: 0.75 },
                    opts: { priority: priority === 'high' ? 10 : 5 },
                });
            } catch (e) {
                logError('support_ticket_queue_enqueue_failed', e, { ticketId: String(ticket._id) });
            }
        }

        return NextResponse.json({ ticket, message: 'Ticket created successfully.' });

    } catch (error: any) {
        logError('support_ticket_create_failed', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
