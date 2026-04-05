import { Worker, Job } from 'bullmq';
import { POSTING_QUEUE } from '../lib/queue';
import { getRedisOptions } from '../lib/redis';
import connectDB from '../lib/mongodb';
import ScheduledPost from '../models/ScheduledPost';
import { uploadScheduledPost } from '../services/youtubeUpload';

// Initialize worker
const worker = new Worker(
  POSTING_QUEUE,
  async (job: Job) => {
    const { postId, userId, platform } = job.data;
    
    console.log(`[PostingWorker] Processing job ${job.id} for post ${postId}`);
    
    try {
      await connectDB();
      
      const post = await ScheduledPost.findById(postId);
      if (!post) {
        throw new Error(`Post ${postId} not found`);
      }
      
      if (post.status === 'cancelled') {
        console.log(`[PostingWorker] Post ${postId} was cancelled. Skipping.`);
        return;
      }

      if (platform === 'youtube') {
        console.log(`[PostingWorker] Uploading post ${postId} to YouTube...`);
        const result = await uploadScheduledPost(userId, post);
        
        post.status = 'posted';
        post.postedAt = new Date();
        post.metadata = { ...post.metadata, youtubeResult: result, posted: true };
        await post.save();
        
        console.log(`[PostingWorker] Successfully posted ${postId} to YouTube`);
      } else {
        console.warn(`[PostingWorker] Platform ${platform} not fully implemented yet.`);
        post.status = 'failed';
        post.metadata = { ...post.metadata, error: `Platform ${platform} not implemented` };
        await post.save();
      }
    } catch (error: any) {
      console.error(`[PostingWorker] Failed to process job ${job.id}:`, error);
      
      try {
        await connectDB();
        await ScheduledPost.findByIdAndUpdate(postId, {
          status: 'failed',
          $set: { 'metadata.error': error.message }
        });
      } catch (dbErr) {
        console.error('[PostingWorker] Failed to update post status on error:', dbErr);
      }
      
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: getRedisOptions(),
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`[PostingWorker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[PostingWorker] Job ${job?.id} failed:`, err);
});

console.log(`[PostingWorker] Dedicated posting worker started for queue: ${POSTING_QUEUE}`);
