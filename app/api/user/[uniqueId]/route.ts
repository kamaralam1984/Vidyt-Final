export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { uniqueId: string } }
) {
  try {
    await connectDB();
    
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { uniqueId } = params;

    // Find user by unique ID
    const user = await User.findOne({ uniqueId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if requesting user has access (own profile or admin)
    if (user._id.toString() !== authUser.id && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        uniqueId: user.uniqueId,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        phone: user.phone,
        role: user.role,
        subscription: user.subscription,
        subscriptionPlan: user.subscriptionPlan,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
