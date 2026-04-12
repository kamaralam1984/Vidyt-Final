import { Queue, JobsOptions } from 'bullmq';
import crypto from 'crypto';

export const TRACKING_QUEUE = process.env.TRACKING_QUEUE_NAME || 'tracking-events';

let queueInstance: Queue | null = null;
let queueFailed = false; // Track if queue has previously failed to avoid repeated connection attempts

function getBullConnection() {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    // Short connect timeout so we fail fast instead of causing 504s
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  };
}

export function getTrackingQueue(): Queue | null {
  if (queueFailed) return null;
  if (queueInstance) return queueInstance;
  try {
    queueInstance = new Queue(TRACKING_QUEUE, {
      connection: getBullConnection() as any,
    });
    return queueInstance;
  } catch {
    queueFailed = true;
    return null;
  }
}

export async function closeTrackingQueue() {
  if (!queueInstance) return;
  try {
    await queueInstance.close();
  } catch {
    // ignore
  } finally {
    queueInstance = null;
  }
}

export type NormalizedTrackingAction = 'start' | 'end' | 'heartbeat' | 'page';

export type TrackingEventPayload = {
  jobType: 'tracking_event';
  eventId: string;
  userId: string;
  sessionId: string;
  // Rounded to seconds in producer for idempotency stability.
  timestamp: string; // ISO
  normalizedAction: NormalizedTrackingAction;
  page: string;
  previousPage?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  distanceFromAdmin?: number;
};

export type EnqueueTrackingEventOptions = {
  opts?: JobsOptions;
};

function makeDefaultEventIdempotencyKey(payload: TrackingEventPayload) {
  // jobId is eventId (already deterministic); this is only as a fallback.
  const h = crypto
    .createHash('sha256')
    .update(payload.eventId)
    .digest('hex');
  return `tracking:${payload.eventId}:${h}`;
}

export async function enqueueTrackingEvent(
  payload: Omit<TrackingEventPayload, 'jobType'>,
  options: EnqueueTrackingEventOptions = {}
) {
  const queue = getTrackingQueue();
  // If Redis/BullMQ is unavailable, skip queueing silently (best-effort tracking)
  if (!queue) return null;

  const data: TrackingEventPayload = { jobType: 'tracking_event', ...payload };

  const jobId = options.opts?.jobId || payload.eventId || makeDefaultEventIdempotencyKey(data);

  // No removeOnFail so we can inspect retries in dev.
  try {
    return await queue.add(
      'tracking_event',
      data,
      {
        jobId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 300 },
        removeOnComplete: 200,
        ...options.opts,
      }
    );
  } catch (err: any) {
    // Idempotent dedupe: if jobId already exists, return it.
    try {
      const existing = await queue.getJob(jobId);
      if (existing) return existing;
    } catch {
      // Queue is truly broken — skip silently
      queueFailed = true;
      queueInstance = null;
      return null;
    }
    throw err;
  }
}
