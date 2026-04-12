export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ScheduledPost from '@/models/ScheduledPost';

/**
 * GET: Get scheduled posts for the user
 * Query params:
 *  - status: 'scheduled' | 'posted' | 'failed' | 'cancelled'
 *  - limit: number (default 50)
 *  - offset: number (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const filter: any = { userId: authUser.id };
    if (status) {
      filter.status = status;
    }

    const total = await ScheduledPost.countDocuments(filter);
    const posts = await ScheduledPost.find(filter)
      .sort({ scheduledAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean() as any[];

    const formatted = posts.map(post => ({
      id: post._id?.toString() || post._id,
      title: post.title,
      description: post.description,
      platform: post.platform,
      scheduledAt: post.scheduledAt,
      postedAt: post.postedAt,
      status: post.status,
      videoUrl: post.videoUrl,
      thumbnailUrl: post.thumbnailUrl,
      hashtags: post.hashtags,
      createdAt: post.createdAt,
      metadata: post.metadata,
      youtubeVideoId: post.metadata?.youtubeVideoId,
      error: post.metadata?.error,
    }));

    return NextResponse.json({
      success: true,
      data: {
        total,
        limit,
        offset,
        posts: formatted,
      },
    });
  } catch (error: any) {
    console.error('Get scheduled posts error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get scheduled posts',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update a scheduled post (e.g., renew, edit)
 * Body: { postId, updates: { title?, description?, scheduledAt?, ... } }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { postId, updates } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    // Only allow updating certain fields
    const allowedUpdates = ['title', 'description', 'scheduledAt', 'hashtags'];
    const filteredUpdates: any = {};
    
    for (const key of allowedUpdates) {
      if (key in (updates || {})) {
        filteredUpdates[key] = updates[key];
      }
    }

    const post = await ScheduledPost.findOne({
      _id: postId,
      userId: authUser.id,
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Can't edit posted or failed posts
    if (post.status === 'posted' || post.status === 'failed') {
      return NextResponse.json(
        { error: `Cannot edit ${post.status} posts` },
        { status: 400 }
      );
    }

    // If rescheduling, reset status to 'scheduled'
    if (filteredUpdates.scheduledAt) {
      filteredUpdates.status = 'scheduled';
      filteredUpdates.postedAt = undefined;
    }

    Object.assign(post, filteredUpdates);
    await post.save();

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
      post: {
        id: post._id,
        title: post.title,
        scheduledAt: post.scheduledAt,
        status: post.status,
      },
    });
  } catch (error: any) {
    console.error('Update scheduled post error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update post',
      },
      { status: 500 }
    );
  }
}
