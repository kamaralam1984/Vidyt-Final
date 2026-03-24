export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  action: z.enum(['set-role', 'reset-password', 'set-pin', 'clear-pin', 'update', 'set-account-manager']),
  role: z.enum(['user', 'manager', 'admin', 'super-admin']).optional(),
  newPassword: z.string().min(6).optional(),
  newPin: z.string().min(4).max(6).optional(),
  name: z.string().optional(),
  accountManagerEmail: z.string().email().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, role, newPassword, newPin, name, accountManagerEmail } = updateSchema.parse(body);

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'set-role') {
      if (!role) {
        return NextResponse.json({ error: 'Role is required' }, { status: 400 });
      }
      user.role = role;
    } else if (action === 'reset-password') {
      const passwordToSet = newPassword || Math.random().toString(36).slice(-10) + 'A1';
      user.password = await hashPassword(passwordToSet);
    } else if (action === 'set-pin') {
      if (!newPin) {
        return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
      }
      user.loginPin = newPin;
    } else if (action === 'clear-pin') {
      user.loginPin = undefined;
    } else if (action === 'set-account-manager') {
      user.accountManagerEmail = accountManagerEmail ?? undefined;
    } else if (action === 'update') {
      if (name !== undefined) user.name = name;
      if (role !== undefined) user.role = role;
    }

    await user.save();

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await User.findByIdAndDelete(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

