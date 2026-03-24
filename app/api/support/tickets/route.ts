export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import TicketReply from '@/models/TicketReply';
import User from '@/models/User';
import PlatformControl from '@/models/PlatformControl';
import { getApiConfig } from '@/lib/apiConfig';

const generateAIResponse = async (apiKey: string, prompt: string) => {
    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a SaaS support assistant. Solve the user issue clearly and provide a helpful step-by-step solution.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const data = await res.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }
    } catch (error) {
        console.error('OpenAI Error:', error);
    }
    return null;
};

export async function GET(req: NextRequest) {
    try {
        const authUser = await getUserFromRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findById(authUser.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let query = {};
        if (user.role !== 'admin' && user.role !== 'super-admin') {
            query = { userId: user._id };
        }

        const tickets = await Ticket.find(query).sort({ createdAt: -1 });
        return NextResponse.json({ tickets });
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

        // Trigger AI Auto-reply 
        if (isAiAllowed) {
            const apiConfig = await getApiConfig();
            if (apiConfig.openaiApiKey) {
                const aiPrompt = `User Plan: ${plan.toUpperCase()}\nIssue: ${message}\n\nPlease help this user out clearly.`;
                const aiMsg = await generateAIResponse(apiConfig.openaiApiKey, aiPrompt);
                
                if (aiMsg) {
                    await TicketReply.create({
                        ticketId: ticket._id,
                        sender: 'ai',
                        message: aiMsg
                    });
                }
            }
        }

        return NextResponse.json({ ticket, message: 'Ticket created successfully.' });

    } catch (error: any) {
        console.error('Ticket Create Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
