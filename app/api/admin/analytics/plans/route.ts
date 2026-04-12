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

    // Aggregate users grouping by 'subscription'
    const planDistribution = await User.aggregate([
      {
        $group: {
          _id: '$subscription',
          count: { $sum: 1 }
        }
      },
      {
         $project: {
             _id: 0,
             plan: { $ifNull: ['$_id', 'free'] },
             count: 1
         }
      },
      {
          $sort: { count: -1 }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: planDistribution
    });

  } catch (error: any) {
    console.error('Analytics plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan distribution analytics' },
      { status: 500 }
    );
  }
}
