export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ChatSession from '@/models/ChatSession';
import ChatMessage from '@/models/ChatMessage';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(auth.id).select('_id').lean() as { _id: any } | null;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    let session: any = null;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: user._id });
    }
    if (!session) {
      session = await ChatSession.findOne({ userId: user._id, channel: 'support' }).sort({ updatedAt: -1 });
    }
    if (!session) return NextResponse.json({ success: true, session: null, messages: [] });

    const messages = await ChatMessage.find({ sessionId: session._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      success: true,
      session,
      messages,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load chat history' }, { status: 500 });
  }
}
