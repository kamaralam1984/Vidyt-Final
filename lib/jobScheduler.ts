import cron from 'node-cron';
import { ingestAllPlatforms } from '@/services/dataPipeline/ingestion';
import { enqueueAiJob } from '@/lib/queue';
import { processDueScheduledPosts, retryFailedPosts } from '@/services/scheduler/uploadScheduledPosts';

/**
 * Job Scheduler for background tasks
 * Runs data ingestion, trend analysis, and other periodic tasks
 */

class JobScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log('🚀 Starting job scheduler...');

    // Data ingestion every hour
    this.scheduleJob('data-ingestion', '0 * * * *', async () => {
      console.log('📊 Running data ingestion job...');
      try {
        const result = await ingestAllPlatforms();
        console.log(`✅ Data ingestion complete: ${result.collected} items collected`);
        if (result.errors.length > 0) {
          console.error('⚠️ Errors:', result.errors);
        }
      } catch (error) {
        console.error('❌ Data ingestion failed:', error);
      }
    });

    // Trend analysis every 6 hours
    this.scheduleJob('trend-analysis', '0 */6 * * *', async () => {
      console.log('📈 Running trend analysis job...');
      // TODO: Implement trend analysis
    });

    // Viral dataset cleanup (daily)
    this.scheduleJob('dataset-cleanup', '0 2 * * *', async () => {
      console.log('🧹 Running dataset cleanup job...');
      // TODO: Remove old non-viral videos
    });

    // Usage records cleanup (daily at 4 AM)
    this.scheduleJob('usage-cleanup', '0 4 * * *', async () => {
        console.log('🧹 Cleaning up old usage records...');
        try {
            const Usage = (await import('@/models/Usage')).default;
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
            
            const result = await Usage.deleteMany({ date: { $lt: dateStr } });
            console.log(`✅ Cleaned up ${result.deletedCount} usage records.`);
        } catch (error) {
            console.error('❌ Usage cleanup failed:', error);
        }
    });

    // AI model retraining (weekly)
    this.scheduleJob('model-retraining', '0 3 * * 0', async () => {
      console.log('🤖 Running AI model retraining job...');
      try {
        const job = await enqueueAiJob({
          jobType: 'training',
          data: { triggeredBy: 'scheduler', minSamples: 100 },
          opts: { priority: 10 },
        });
        console.log(`✅ AI retraining enqueued: ${String(job.id)}`);
      } catch (error) {
        console.error('❌ AI model retraining enqueue failed:', error);
      }
    });

    // Process scheduled posts (every minute)
    this.scheduleJob('scheduled-post-upload', '* * * * *', async () => {
      console.log('📤 Checking for scheduled posts due for upload...');
      try {
        const result = await processDueScheduledPosts();
        if (result.processed > 0) {
          console.log(`✅ Processed ${result.processed} posts: ${result.successful} successful, ${result.failed} failed`);
          if (result.errors.length > 0) {
            console.error('⚠️ Upload errors:', result.errors);
          }
        }
      } catch (error) {
        console.error('❌ Scheduled post upload job failed:', error);
      }
    });

    // Retry failed posts (every 15 minutes)
    this.scheduleJob('retry-failed-posts', '*/15 * * * *', async () => {
      console.log('🔄 Retrying failed scheduled posts...');
      try {
        const result = await retryFailedPosts(3);
        if (result.retried > 0) {
          console.log(`✅ Retried ${result.retried} posts: ${result.successful} successful, ${result.failed} failed`);
        }
      } catch (error) {
        console.error('❌ Retry failed posts job failed:', error);
      }
    });

    console.log(`✅ Job scheduler started with ${this.jobs.size} jobs`);
  }

  /**
   * Schedule a cron job
   */
  private scheduleJob(
    name: string,
    schedule: string,
    task: () => Promise<void>
  ) {
    const job = cron.schedule(schedule, task, {
      scheduled: false,
      timezone: 'UTC',
    });

    this.jobs.set(name, job);
    job.start();
    console.log(`📅 Scheduled job: ${name} (${schedule})`);
  }

  /**
   * Stop all jobs
   */
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      activeJobs: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
    };
  }
}

// Singleton instance
let scheduler: JobScheduler | null = null;

export function getJobScheduler(): JobScheduler {
  if (!scheduler) {
    scheduler = new JobScheduler();
  }
  return scheduler;
}

// Start scheduler in development (in production, use PM2 or similar)
if (process.env.NODE_ENV === 'development') {
  // Only start in server context
  if (typeof window === 'undefined') {
    const scheduler = getJobScheduler();
    scheduler.start();
  }
}
