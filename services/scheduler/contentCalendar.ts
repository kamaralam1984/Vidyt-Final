/**
 * Content Calendar & Scheduling Service
 * Manages scheduled posts and content calendar
 */

import ScheduledPost, { IScheduledPost } from '@/models/ScheduledPost';
import connectDB from '@/lib/mongodb';

export interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  scheduledAt: Date;
  status: string;
  thumbnailUrl?: string;
}

export interface CalendarView {
  events: CalendarEvent[];
  totalScheduled: number;
  totalPosted: number;
  upcomingPosts: CalendarEvent[];
}

/**
 * Get content calendar for user
 */
export async function getContentCalendar(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarView> {
  await connectDB();

  const filter: any = { userId };
  
  if (startDate || endDate) {
    filter.scheduledAt = {};
    if (startDate) filter.scheduledAt.$gte = startDate;
    if (endDate) filter.scheduledAt.$lte = endDate;
  }

  const posts = await ScheduledPost.find(filter)
    .sort({ scheduledAt: 1 });

  const events: CalendarEvent[] = posts.map(post => ({
    id: post._id.toString(),
    title: post.title,
    platform: post.platform,
    scheduledAt: post.scheduledAt,
    status: post.status,
    thumbnailUrl: post.thumbnailUrl,
  }));

  const totalScheduled = posts.filter(p => p.status === 'scheduled').length;
  const totalPosted = posts.filter(p => p.status === 'posted').length;
  const upcomingPosts = events
    .filter(e => e.status === 'scheduled' && new Date(e.scheduledAt) > new Date())
    .slice(0, 10);

  return {
    events,
    totalScheduled,
    totalPosted,
    upcomingPosts,
  };
}

/**
 * Schedule a post
 */
export async function schedulePost(
  userId: string,
  data: {
    title: string;
    description?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
    scheduledAt: Date;
    hashtags?: string[];
  }
): Promise<IScheduledPost> {
  await connectDB();

  const post = new ScheduledPost({
    userId,
    title: data.title,
    description: data.description,
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl,
    platform: data.platform,
    scheduledAt: data.scheduledAt,
    hashtags: data.hashtags || [],
    status: 'scheduled',
  });

  await post.save();
  return post;
}

/**
 * Cancel scheduled post
 */
export async function cancelScheduledPost(
  postId: string,
  userId: string
): Promise<void> {
  await connectDB();

  const post = await ScheduledPost.findOne({ _id: postId, userId });
  if (!post) {
    throw new Error('Post not found');
  }

  if (post.status === 'posted') {
    throw new Error('Cannot cancel already posted content');
  }

  post.status = 'cancelled';
  await post.save();
}

/**
 * Get posts for specific date range
 */
export async function getPostsForDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<IScheduledPost[]> {
  await connectDB();

  return ScheduledPost.find({
    userId,
    scheduledAt: {
      $gte: startDate,
      $lte: endDate,
    },
    status: { $in: ['scheduled', 'posted'] },
  }).sort({ scheduledAt: 1 });
}

/**
 * Bulk schedule posts
 */
export async function bulkSchedulePosts(
  userId: string,
  posts: Array<{
    title: string;
    platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
    scheduledAt: Date;
    description?: string;
    hashtags?: string[];
  }>
): Promise<IScheduledPost[]> {
  await connectDB();

  const scheduledPosts = posts.map(postData => ({
    userId,
    title: postData.title,
    description: postData.description,
    platform: postData.platform,
    scheduledAt: postData.scheduledAt,
    hashtags: postData.hashtags || [],
    status: 'scheduled' as const,
  }));

  return ScheduledPost.insertMany(scheduledPosts);
}
