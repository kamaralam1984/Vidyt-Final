export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import TicketReply from '@/models/TicketReply';
import User from '@/models/User';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
    try {
        const authUser = await getUserFromRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findById(authUser.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const params = await context.params;
        const ticketId = params.id;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        const isAdmin = user.role === 'admin' || user.role === 'super-admin';

        if (!isAdmin && ticket.userId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { message, status, priority } = await req.json();

        if (!message && !status && !priority) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        if (message) {
            await TicketReply.create({
                ticketId: ticket._id,
                sender: isAdmin ? 'admin' : 'user',
                message
            });
        }

        if (isAdmin && (status || priority)) {
            if (status) ticket.status = status;
            if (priority) ticket.priority = priority;
            await ticket.save();
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
