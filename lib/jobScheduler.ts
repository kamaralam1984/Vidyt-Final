import cron from 'node-cron';
import { ingestAllPlatforms } from '@/services/dataPipeline/ingestion';

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

    // AI model retraining (weekly)
    this.scheduleJob('model-retraining', '0 3 * * 0', async () => {
      console.log('🤖 Running AI model retraining job...');
      // TODO: Retrain models with new data
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
