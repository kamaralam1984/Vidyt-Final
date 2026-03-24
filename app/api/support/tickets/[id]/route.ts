export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import TicketReply from '@/models/TicketReply';
import User from '@/models/User';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
    try {
        const authUser = await getUserFromRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findById(authUser.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Await params if it's a Promise (Next.js 15+ convention for dynamic routes)
        const params = await context.params;
        const ticketId = params.id;

        const ticket = await Ticket.findById(ticketId).populate('userId', 'name email image subscription');
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        if (user.role !== 'admin' && user.role !== 'super-admin' && ticket.userId._id.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const replies = await TicketReply.find({ ticketId }).sort({ createdAt: 1 });

        return NextResponse.json({ ticket, replies });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
