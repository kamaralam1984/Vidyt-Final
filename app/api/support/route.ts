import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import SupportTicket from '@/models/SupportTicket';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const tickets = await SupportTicket.find({ userId: authUser.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ tickets });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findById(authUser.id).select('subscription').lean();
    const body = await request.json();
    const { subject, message } = body;
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message required' }, { status: 400 });
    }
    const priority = (user?.subscription === 'enterprise' ? 'priority' : user?.subscription === 'pro' ? 'high' : 'normal') as 'normal' | 'high' | 'priority';
    const ticket = await SupportTicket.create({
      userId: authUser.id,
      subject: subject.trim(),
      message: message.trim(),
      priority,
      status: 'open',
    });
    return NextResponse.json({ success: true, ticket: { id: ticket._id, subject: ticket.subject, priority: ticket.priority, status: ticket.status, createdAt: ticket.createdAt } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create ticket' }, { status: 500 });
  }
}
