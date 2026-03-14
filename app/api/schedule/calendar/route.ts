import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getContentCalendar, getPostsForDateRange } from '@/services/scheduler/contentCalendar';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    if (startDate && endDate) {
      // Get posts for specific date range
      const posts = await getPostsForDateRange(authUser.id, startDate, endDate);
      return NextResponse.json({
        success: true,
        posts: posts.map(p => ({
          id: p._id,
          title: p.title,
          platform: p.platform,
          scheduledAt: p.scheduledAt,
          status: p.status,
          thumbnailUrl: p.thumbnailUrl,
        })),
      });
    } else {
      // Get full calendar view
      const calendar = await getContentCalendar(authUser.id, startDate, endDate);
      return NextResponse.json({
        success: true,
        calendar,
      });
    }
  } catch (error: any) {
    console.error('Get calendar error:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar' },
      { status: 500 }
    );
  }
}
