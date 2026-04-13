export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { schedulePost, cancelScheduledPost, bulkSchedulePosts } from '@/services/scheduler/contentCalendar';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ScheduledPost from '@/models/ScheduledPost';
import { getBulkSchedulingLimit, getSchedulePostsLimit } from '@/lib/usageDisplayLimits';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { checkUsageLimit, recordUsage } from '@/lib/usageControl';

/**
 * Schedule a post with optional file uploads
 */
export async function POST(request: NextRequest) {
  let uploadedFilePaths: string[] = [];
  
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const dbUser = await User.findById(authUser.id).select('subscription');
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const planId = String(dbUser.subscription || 'free');
    const activeScheduleLimit = getSchedulePostsLimit(planId);
    const bulkLimit = getBulkSchedulingLimit(planId);

    const activeScheduledCount = await ScheduledPost.countDocuments({
      userId: authUser.id,
      status: 'scheduled',
    });

    // Parse FormData or JSON
    let formData;
    let body;
    
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      formData = await request.formData();
    } else {
      body = await request.json();
    }

    const { posts, bulk } = formData ? {} : body;

    if (bulk && Array.isArray(posts)) {
      const check = await checkUsageLimit(authUser.id, planId, 'bulk_scheduling');
      if (!check.allowed) {
          return NextResponse.json({
            error: 'LIMIT_REACHED',
            message: `Bulk scheduling limit reached (${check.limit}). Upgrade your plan.`
          }, { status: 403 });
      }

      // Bulk scheduling
      const scheduled = await bulkSchedulePosts(authUser.id, posts);
      await recordUsage(authUser.id, 'bulk_scheduling');
      
      return NextResponse.json({
        success: true,
        message: `${scheduled.length} posts scheduled successfully`,
        posts: scheduled,
      });
    } else {
      // Single post scheduling
      let title, description, videoUrl, thumbnailUrl, platform, scheduledAt, hashtags, privacyStatus;

      if (formData) {
        // Handle FormData with file uploads
        title = formData.get('title') as string;
        description = formData.get('description') as string || undefined;
        platform = formData.get('platform') as string;
        scheduledAt = formData.get('scheduledAt') as string;
        privacyStatus = (formData.get('privacyStatus') as string) || 'public';
        videoUrl = (formData.get('videoUrl') as string) || undefined;
        const hashtagsStr = formData.get('hashtags');
        hashtags = hashtagsStr ? JSON.parse(hashtagsStr as string) : [];

        // Handle video file upload
        const videoFile = formData.get('videoFile') as File | null;
        if (videoFile) {
          const uploadedPath = await saveUploadedFile(videoFile, 'videos', authUser.id);
          uploadedFilePaths.push(uploadedPath);
          videoUrl = uploadedPath;
        }

        // Handle thumbnail file upload
        const thumbnailFile = formData.get('thumbnailFile') as File | null;
        if (thumbnailFile) {
          const uploadedPath = await saveUploadedFile(thumbnailFile, 'thumbnails', authUser.id);
          uploadedFilePaths.push(uploadedPath);
          thumbnailUrl = uploadedPath;
        }
      } else {
        // Handle JSON body
        title = body.title;
        description = body.description;
        videoUrl = body.videoUrl;
        thumbnailUrl = body.thumbnailUrl;
        platform = body.platform;
        scheduledAt = body.scheduledAt;
        hashtags = body.hashtags;
        privacyStatus = body.privacyStatus || 'public';
      }

      if (!title || !platform || !scheduledAt) {
        return NextResponse.json(
          { error: 'title, platform, and scheduledAt are required' },
          { status: 400 }
        );
      }
      
      const check = await checkUsageLimit(authUser.id, planId, 'schedule_posts');
      if (!check.allowed) {
          return NextResponse.json({
            error: 'LIMIT_REACHED',
            message: `Post scheduling limit reached (${check.limit}). Upgrade your plan.`
          }, { status: 403 });
      }

      const post = await schedulePost(authUser.id, {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        platform,
        scheduledAt: new Date(scheduledAt),
        hashtags: hashtags || [],
        privacyStatus: privacyStatus || 'public',
      });

      await recordUsage(authUser.id, 'schedule_posts');

      return NextResponse.json({
        success: true,
        message: 'Post scheduled successfully',
        post: {
          id: post._id,
          title: post.title,
          platform: post.platform,
          scheduledAt: post.scheduledAt,
          status: post.status,
          videoUrl: post.videoUrl,
          thumbnailUrl: post.thumbnailUrl,
        },
      });
    }
  } catch (error: any) {
    // Clean up uploaded files on error
    for (const filePath of uploadedFilePaths) {
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }

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
 * Save uploaded file to local storage
 */
async function saveUploadedFile(
  file: File,
  type: 'videos' | 'thumbnails',
  userId: string
): Promise<string> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type, userId);
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${crypto.randomBytes(8).toString('hex')}-${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(bytes));

    // Return a relative path that can be used as a URL
    return `/uploads/${type}/${userId}/${filename}`;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
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
