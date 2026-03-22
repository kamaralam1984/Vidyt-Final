import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Subscription from '@/models/Subscription';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getUserFromRequest(request);
    
    // Ensure Super Admin privileges
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = (searchParams.get('search') || '').trim();

    // Define search query
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { plan: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Step 1: Query database and join User data
    let subscriptionsQuery = Subscription.find(query)
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });

    const total = await Subscription.countDocuments(query);
    const data = await subscriptionsQuery.skip((page - 1) * limit).limit(limit).lean();

    // Step 2: Format the objects for generic flattening in frontend Admin Table
    const formattedData = data.map((sub: any) => {
        // Handle searching manually by email if populate brings it back, since doing regex deeply in Mongoose populate is trickier
        const userObj = sub.userId || {};
        const userEmail = typeof userObj === 'object' ? userObj.email : 'Unknown';
        const userName = typeof userObj === 'object' ? userObj.name : 'Unknown';
        const userIdToken = typeof userObj === 'object' ? userObj._id : sub.userId;
        
        return {
            _id: sub._id?.toString(),
            userEmail,
            userName,
            userId: userIdToken?.toString(),
            plan: sub.plan,
            status: sub.status,
            periodStart: sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleString() : 'N/A',
            periodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleString() : 'N/A',
            paidAmount: sub.billingHistory?.length > 0 ? sub.billingHistory[0].amount : 0,
            currency: sub.billingHistory?.length > 0 ? sub.billingHistory[0].currency : 'USD',
            paymentMethod: sub.paymentMethod?.type || 'N/A',
            createdAt: sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A'
        };
    });

    // Sub-search filtering by email manually if Mongoose query fails text
    let finalData = formattedData;
    if (search) {
        finalData = finalData.filter(d => 
            d.userEmail.toLowerCase().includes(search.toLowerCase()) || 
            d.userName.toLowerCase().includes(search.toLowerCase()) ||
            d.plan.toLowerCase().includes(search.toLowerCase()) ||
            d.status.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    // Debug log as requested by User
    console.log("Subscriptions:", finalData.slice(0, 2), "Total:", finalData.length);

    return NextResponse.json({
      success: true,
      data: finalData,
      pagination: {
        page,
        limit,
        total
      }
    });

  } catch (error: any) {
    console.error('Fetch subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to load subscriptions' }, { status: 500 });
  }
}
