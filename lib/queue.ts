import { Queue, JobsOptions } from 'bullmq';
import AIJobLog from '@/models/AIJobLog';
import connectDB from '@/lib/mongodb';
import crypto from 'crypto';

export const AI_QUEUE = process.env.AI_QUEUE_NAME || 'ai-jobs';

let queueInstance: Queue | null = null;

function getBullConnection() {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

export function getAiQueue() {
  if (queueInstance) return queueInstance;
  queueInstance = new Queue(AI_QUEUE, { connection: getBullConnection() });
  return queueInstance;
}

export async function closeAiQueue() {
  if (!queueInstance) return;
  try {
    await queueInstance.close();
  } catch {
    // ignore
  } finally {
    queueInstance = null;
  }
}

type EnqueuePayload = {
  jobType: 'prediction' | 'training' | 'support_ai';
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

function makeDefaultIdempotencyKey(payload: EnqueuePayload): string {
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
  return `${payload.jobType}:${payload.userId ?? 'anon'}:${hash}`;
}

export async function enqueueAiJob(payload: EnqueuePayload) {
  const queue = getAiQueue();

  const jobId = payload.opts?.jobId || payload.idempotencyKey || makeDefaultIdempotencyKey(payload);
  let job: any = null;

  try {
    job = await queue.add(payload.jobType, payload.data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 200,
      jobId,
      ...payload.opts,
    });
  } catch (err: any) {
    // Idempotent dedupe: if jobId already exists, return the existing job.
    job = await queue.getJob(jobId);
    if (!job) throw err;
  }

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
    console.error('[enqueueAiJob] failed to write AIJobLog', e);
  }

  return job;
}
