export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
import crypto from 'crypto';

const MAX_MEMBERS_ENTERPRISE = 10;

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const teams = await Team.find({
      $or: [{ ownerId: authUser.id }, { 'members.userId': authUser.id }],
    }).lean();
    return NextResponse.json({ teams });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findById(authUser.id).select('subscription').lean();
    if (user?.subscription !== 'enterprise') {
      return NextResponse.json({ error: 'Team collaboration is available for Enterprise plan only' }, { status: 403 });
    }
    const body = await request.json();
    const { name } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Team name required' }, { status: 400 });
    const existing = await Team.findOne({ ownerId: authUser.id });
    if (existing) return NextResponse.json({ error: 'You already have a team' }, { status: 400 });
    const team = await Team.create({
      name: name.trim(),
      ownerId: authUser.id,
      maxMembers: MAX_MEMBERS_ENTERPRISE,
      members: [{ userId: authUser.id, email: authUser.email || '', role: 'owner', joinedAt: new Date() }],
      inviteToken: crypto.randomBytes(24).toString('hex'),
      inviteTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return NextResponse.json({
      success: true,
      team: {
        id: team._id,
        name: team.name,
        members: team.members,
        maxMembers: team.maxMembers,
        inviteLink: `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/team/join?token=${team.inviteToken}`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create team' }, { status: 500 });
  }
}
