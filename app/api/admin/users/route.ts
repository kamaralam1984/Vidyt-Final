import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest, hashPassword, generateUniqueNumericId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u._id.toString(),
        uniqueId: u.uniqueId,
        email: u.email,
        name: u.name,
        role: u.role,
        subscription: u.subscription,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        hasPin: !!u.loginPin,
      })),
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (error: any) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password;
    const name = (body.name || '').trim() || email.split('@')[0];
    const role = ['user', 'admin', 'manager', 'super-admin'].includes(body.role) ? body.role : 'user';
    const loginPin = body.loginPin != null ? String(body.loginPin).trim() : undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const uniqueId = await generateUniqueNumericId();
    const hashedPassword = await hashPassword(String(password));

    const user = new User({
      uniqueId,
      email,
      password: hashedPassword,
      name,
      role,
      subscription: 'free',
      emailVerified: false,
      loginPin: loginPin || undefined,
    });
    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        uniqueId: user.uniqueId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Admin create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

