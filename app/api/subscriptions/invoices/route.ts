export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json({ invoices: [] });
    }

    const planId = (userDoc.subscriptionPlan?.planId || userDoc.subscription || 'free').toLowerCase();
    const plan = planId === 'pro' || planId === 'enterprise' ? planId : 'free';
    const subPlan = userDoc.subscriptionPlan;

    const amount = subPlan?.price ?? (plan === 'pro' ? 5 : plan === 'enterprise' ? 12 : 0);
    const date = subPlan?.startDate || userDoc.subscriptionExpiresAt || userDoc.updatedAt || new Date();

    const currency = (subPlan?.currency || 'INR').toUpperCase();

    const invoices = plan === 'free' && !subPlan
      ? []
      : [
          {
            id: 'inv_001',
            amount: typeof amount === 'number' ? amount : 0,
            date: new Date(date).toISOString(),
            status: 'paid' as const,
            plan,
            currency,
          },
        ];

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
