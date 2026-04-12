export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const totalUsers = await User.countDocuments();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Active defined as logged in within 30 days
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Estimate Revenue based on active plan prices globally
    const paidUsers = await User.find({
       'subscriptionPlan.status': 'active',
       'subscriptionPlan.price': { $gt: 0 }
    }).select('subscriptionPlan.price');
    
    const monthlyRevenue = paidUsers.reduce((acc, user) => {
        return acc + (user.subscriptionPlan?.price || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        monthlyRevenue
      }
    });

  } catch (error: any) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}
