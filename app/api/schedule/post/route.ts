export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { schedulePost, cancelScheduledPost, bulkSchedulePosts } from '@/services/scheduler/contentCalendar';

/**
 * Schedule a post
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { posts, bulk } = body;

    if (bulk && Array.isArray(posts)) {
      // Bulk scheduling
      const scheduled = await bulkSchedulePosts(authUser.id, posts);
      return NextResponse.json({
        success: true,
        message: `${scheduled.length} posts scheduled successfully`,
        posts: scheduled,
      });
    } else {
      // Single post scheduling
      const { title, description, videoUrl, thumbnailUrl, platform, scheduledAt, hashtags } = body;

      if (!title || !platform || !scheduledAt) {
        return NextResponse.json(
          { error: 'title, platform, and scheduledAt are required' },
          { status: 400 }
        );
      }

      const post = await schedulePost(authUser.id, {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        platform,
        scheduledAt: new Date(scheduledAt),
        hashtags,
      });

      return NextResponse.json({
        success: true,
        message: 'Post scheduled successfully',
        post: {
          id: post._id,
          title: post.title,
          platform: post.platform,
          scheduledAt: post.scheduledAt,
          status: post.status,
        },
      });
    }
  } catch (error: any) {
    console.error('Schedule post error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to schedule post',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Cancel scheduled post
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    await cancelScheduledPost(postId, authUser.id);

    return NextResponse.json({
      success: true,
      message: 'Post cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel post error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to cancel post',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
