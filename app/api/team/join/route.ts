export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { token } = body;
    if (!token) return NextResponse.json({ error: 'Invite token required' }, { status: 400 });
    await connectDB();
    const team = await Team.findOne({ inviteToken: token, inviteTokenExpires: { $gt: new Date() } });
    if (!team) return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 400 });
    if (team.members.length >= team.maxMembers) return NextResponse.json({ error: 'Team is full' }, { status: 400 });
    if (team.members.some((m: any) => m.userId === authUser.id)) {
      return NextResponse.json({ success: true, message: 'Already in team', team: { id: team._id, name: team.name } });
    }
    team.members.push({
      userId: authUser.id,
      email: authUser.email || '',
      role: 'member',
      joinedAt: new Date(),
    });
    await team.save();
    return NextResponse.json({ success: true, team: { id: team._id, name: team.name, members: team.members.length } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to join team' }, { status: 500 });
  }
}
