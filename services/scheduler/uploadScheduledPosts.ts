/**
 * Service to handle uploading of scheduled posts when their scheduled time arrives
 */

import ScheduledPost, { IScheduledPost } from '@/models/ScheduledPost';
import User from '@/models/User';
import Channel from '@/models/Channel';
import connectDB from '@/lib/mongodb';
import { uploadVideo, refreshAccessToken } from '@/services/youtubeUpload';
import { createReadStream } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

interface UploadResult {
  success: boolean;
  postId: string;
  platformId?: string;
  error?: string;
}

/**
 * Process all due scheduled posts and upload them
 */
export async function processDueScheduledPosts(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: UploadResult[];
}> {
  await connectDB();

  try {
    // Find all posts that are due (scheduledAt <= now and status === 'scheduled')
    const now = new Date();
    const duePosts = await ScheduledPost.find({
      scheduledAt: { $lte: now },
      status: 'scheduled',
    }).lean() as any[];

    console.log(`⏰ Found ${duePosts.length} posts due for upload`);

    let successful = 0;
    let failed = 0;
    const errors: UploadResult[] = [];

    // Process each post
    for (const post of duePosts) {
      try {
        const result = await uploadScheduledPost(post);
        if (result.success) {
          successful++;
          console.log(`✅ Successfully uploaded post ${post._id} to ${post.platform}`);
        } else {
          failed++;
          errors.push(result);
          console.error(`❌ Failed to upload post ${post._id}: ${result.error}`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          success: false,
          postId: post._id?.toString() || String(post._id),
          error: errorMessage,
        });
        console.error(`❌ Error processing post ${post._id}:`, error);
      }
    }

    return {
      processed: duePosts.length,
      successful,
      failed,
      errors,
    };
  } catch (error) {
    console.error('❌ Error in processDueScheduledPosts:', error);
    return {
      processed: 0,
      successful: 0,
      failed: 1,
      errors: [{
        success: false,
        postId: 'batch-process',
        error: error instanceof Error ? error.message : 'Unknown error',
      }],
    };
  }
}

/**
 * Upload a single scheduled post to its platform
 */
async function uploadScheduledPost(post: any): Promise<UploadResult> {
  const postId = post._id.toString();

  try {
    // Currently only supporting YouTube uploads
    if (post.platform !== 'youtube') {
      // Mark as posted for non-YouTube platforms (for now)
      await ScheduledPost.updateOne(
        { _id: post._id },
        {
          status: 'posted',
          postedAt: new Date(),
        }
      );
      return {
        success: true,
        postId,
        platformId: 'not-implemented',
      };
    }

    // Get user and check YouTube connection
    const user = await User.findById(post.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.youtube?.access_token) {
      throw new Error('YouTube not connected for user');
    }

    // Handle video upload
    let videoStream: any;
    let videoTags: string[] = [];

    // Parse tags from description or metadata
    if (post.metadata?.tags) {
      videoTags = Array.isArray(post.metadata.tags)
        ? post.metadata.tags
        : post.metadata.tags.split(',').map((t: string) => t.trim());
    }

    // Check if video is a local file or URL
    if (post.videoUrl?.startsWith('/uploads/')) {
      // Local file upload
      const filePath = join(process.cwd(), 'public', post.videoUrl.replace(/^\//, ''));
      
      if (!existsSync(filePath)) {
        throw new Error(`Video file not found: ${filePath}`);
      }

      videoStream = createReadStream(filePath);
    } else if (post.videoUrl?.startsWith('http')) {
      // External URL - would need to download first
      throw new Error('External URL videos not yet supported for scheduled upload');
    } else {
      throw new Error('No valid video URL provided');
    }

    // Refresh access token if needed
    let accessToken = user.youtube.access_token;
    const tokenExpiry = user.youtube.expiry_date ? new Date(user.youtube.expiry_date) : null;
    
    if (tokenExpiry && tokenExpiry < new Date()) {
      if (!user.youtube.refresh_token) {
        throw new Error('YouTube token expired and no refresh token available');
      }

      try {
        const refreshed = await refreshAccessToken(user.youtube.refresh_token);
        if (refreshed.access_token) {
          accessToken = refreshed.access_token;
          // Update user with new token
          await User.updateOne(
            { _id: post.userId },
            {
              'youtube.access_token': refreshed.access_token,
              'youtube.expiry_date': refreshed.expiry_date || new Date(Date.now() + 60 * 60 * 1000), // Default 1 hour
            }
          );
        }
      } catch (refreshError) {
        throw new Error(`Failed to refresh YouTube token: ${refreshError}`);
      }
    }

    // Upload to YouTube
    const uploadResult = await uploadVideo(accessToken, {
      title: post.title,
      description: post.description || '',
      tags: videoTags,
      category: post.metadata?.category || '22', // People & Blogs
      videoStream: videoStream,
      privacyStatus: post.metadata?.privacyStatus || 'public',
    });

    if (!uploadResult.id) {
      throw new Error('YouTube upload did not return video ID');
    }

    // Update post status
    await ScheduledPost.updateOne(
      { _id: post._id },
      {
        status: 'posted',
        postedAt: new Date(),
        'metadata.youtubeVideoId': uploadResult.id,
        'metadata.uploadedAt': new Date(),
      }
    );

    return {
      success: true,
      postId,
      platformId: uploadResult.id,
    };
  } catch (error) {
    // Mark post as failed
    try {
      await ScheduledPost.updateOne(
        { _id: post._id },
        {
          status: 'failed',
          'metadata.error': error instanceof Error ? error.message : 'Unknown error',
          'metadata.failedAt': new Date(),
        }
      );
    } catch (updateError) {
      console.error('Failed to update post status:', updateError);
    }

    return {
      success: false,
      postId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retry failed posts
 */
export async function retryFailedPosts(maxAttempts: number = 3): Promise<{
  retried: number;
  successful: number;
  failed: number;
}> {
  await connectDB();

  try {
    // Find failed posts that haven't exceeded retry limit
    const failedPosts = await ScheduledPost.find({
      status: 'failed',
      'metadata.attempts': { $lt: maxAttempts },
    });

    let successful = 0;
    let failed = 0;

    for (const post of failedPosts) {
      try {
        const result = await uploadScheduledPost(post);
        if (result.success) {
          successful++;
        } else {
          failed++;
          // Increment attempt counter
          post.metadata = post.metadata || {};
          post.metadata.attempts = (post.metadata.attempts || 0) + 1;
          await post.save();
        }
      } catch (error) {
        failed++;
        post.metadata = post.metadata || {};
        post.metadata.attempts = (post.metadata.attempts || 0) + 1;
        await post.save();
      }
    }

    return {
      retried: failedPosts.length,
      successful,
      failed,
    };
  } catch (error) {
    console.error('Error retrying failed posts:', error);
    return {
      retried: 0,
      successful: 0,
      failed: 1,
    };
  }
}
