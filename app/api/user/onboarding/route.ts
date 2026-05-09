export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const schema = z.object({
  step: z.number().int().min(0).max(10).optional(),
  completed: z.boolean().optional(),
  profile: z
    .object({
      name: z.string().min(1).max(120).optional(),
      companyName: z.string().max(120).optional(),
      phone: z.string().max(32).optional(),
      bio: z.string().max(500).optional(),
    })
    .optional(),
  preferences: z
    .object({
      notifications: z.boolean().optional(),
      emailUpdates: z.boolean().optional(),
      darkMode: z.boolean().optional(),
    })
    .optional(),
  notebook: z
    .object({
      goal: z.string().max(240).optional(),
      niche: z.string().max(80).optional(),
      channelUrl: z.string().max(240).optional(),
      experienceLevel: z.enum(['beginner', 'intermediate', 'pro']).optional(),
      postingFrequency: z.enum(['daily', 'weekly', 'monthly', 'rarely']).optional(),
      note: z.string().max(2000).optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const user = await User.findById(authUser.id)
    .select('onboardingCompleted onboardingStep name companyName phone bio preferences notebook twoFactorEnabled')
    .lean<any>();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({
    completed: !!user.onboardingCompleted,
    step: user.onboardingStep || 0,
    profile: {
      name: user.name || '',
      companyName: user.companyName || '',
      phone: user.phone || '',
      bio: user.bio || '',
    },
    preferences: user.preferences || { notifications: true, emailUpdates: true, darkMode: false },
    notebook: user.notebook || {
      goal: '', niche: '', channelUrl: '',
      experienceLevel: '', postingFrequency: '', note: '',
    },
    twoFactorEnabled: !!user.twoFactorEnabled,
  });
}

export async function POST(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(authUser.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { profile, preferences, notebook, step, completed } = parsed.data;
  if (profile) {
    if (profile.name !== undefined) user.name = profile.name;
    if (profile.companyName !== undefined) user.companyName = profile.companyName;
    if (profile.phone !== undefined) user.phone = profile.phone;
    if (profile.bio !== undefined) user.bio = profile.bio;
  }
  if (preferences) {
    user.preferences = { ...(user.preferences || {}), ...preferences } as any;
  }
  if (notebook) {
    (user as any).notebook = {
      ...((user as any).notebook || {}),
      ...notebook,
      updatedAt: new Date(),
    };
  }
  if (typeof step === 'number') (user as any).onboardingStep = step;
  if (completed === true) {
    (user as any).onboardingCompleted = true;
    (user as any).onboardingStep = 0;
  }
  await user.save();

  return NextResponse.json({
    success: true,
    completed: !!(user as any).onboardingCompleted,
    step: (user as any).onboardingStep || 0,
  });
}
