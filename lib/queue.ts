import { Queue, JobsOptions } from 'bullmq';
import AIJobLog from '@/models/AIJobLog';
import connectDB from '@/lib/mongodb';
import crypto from 'crypto';
import { getRedisOptions } from './redis';

export const AI_QUEUE = process.env.AI_QUEUE_NAME || 'ai-jobs';
export const POSTING_QUEUE = process.env.POSTING_QUEUE_NAME || 'video-posting';

const queues: Record<string, Queue> = {};

export function getQueue(name: string) {
  if (queues[name]) return queues[name];
  
  queues[name] = new Queue(name, { 
    connection: getRedisOptions(),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  });
  return queues[name];
}

export function getAiQueue() {
  return getQueue(AI_QUEUE);
}

export function getPostingQueue() {
  return getQueue(POSTING_QUEUE);
}

export async function closeQueues() {
  for (const name in queues) {
    await queues[name].close();
    delete queues[name];
  }
}

type EnqueuePayload = {
  jobType: string;
  userId?: string;
  data: Record<string, any>;
  opts?: JobsOptions;
  idempotencyKey?: string;
};

function stableStringify(obj: any): string {
  if (obj === null || obj === undefined) return String(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

function makeDefaultIdempotencyKey(queueName: string, payload: EnqueuePayload): string {
  const hash = crypto
    .createHash('sha256')
    .update(
      stableStringify({
        jobType: payload.jobType,
        userId: payload.userId ?? null,
        data: payload.data ?? {},
      })
    )
    .digest('hex');
  return `${queueName}:${payload.jobType}:${payload.userId ?? 'anon'}:${hash}`;
}

/**
 * Enqueue a job into a specific queue
 */
export async function enqueueJob(queueName: string, payload: EnqueuePayload) {
  const queue = getQueue(queueName);

  const jobId = payload.opts?.jobId || payload.idempotencyKey || makeDefaultIdempotencyKey(queueName, payload);
  let job: any = null;

  try {
    job = await queue.add(payload.jobType, payload.data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      jobId,
      ...payload.opts,
    });
  } catch (err: any) {
    // Idempotent dedupe: if jobId already exists, return the existing job.
    job = await queue.getJob(jobId);
    if (!job) throw err;
  }

  // Only log AI jobs to AIJobLog for now, or expand the model for all jobs
  if (queueName === AI_QUEUE) {
    try {
      await connectDB();
      await AIJobLog.findOneAndUpdate(
        { queueJobId: String(job.id) },
        {
          $setOnInsert: {
            jobType: payload.jobType,
            status: 'queued',
            userId: payload.userId,
            input: payload.data,
            attempts: 0,
          },
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.error('[enqueueJob] failed to write AIJobLog', e);
    }
  }

  return job;
}

/**
 * Legacy wrapper for AI jobs
 */
export async function enqueueAiJob(payload: Omit<EnqueuePayload, 'jobType'> & { jobType: 'prediction' | 'training' | 'support_ai' }) {
  return enqueueJob(AI_QUEUE, payload);
}
