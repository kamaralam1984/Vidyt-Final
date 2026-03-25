import { Job, Worker, type Queue } from 'bullmq';
import mongoose from 'mongoose';

import connectDB from '@/lib/mongodb';
import { TRACKING_QUEUE, type TrackingEventPayload, type NormalizedTrackingAction } from '@/lib/trackingQueue';
import TrackingLog from '@/models/TrackingLog';
import ActivityTimeline from '@/models/ActivityTimeline';
import ActivityLog from '@/models/ActivityLog';
import UserSession from '@/models/UserSession';
import TrackingPageStatsDaily from '@/models/TrackingPageStatsDaily';
import { logError, logInfo } from '@/lib/observability';
import { getRedis } from '@/lib/redis';

function toObjectId(userId: string) {
  // Token userId comes from JWT; treat it as ObjectId.
  return new mongoose.Types.ObjectId(userId);
}

function timelineActionFor(normalizedAction: NormalizedTrackingAction): 'page_visit' | 'session_start' | 'session_end' {
  if (normalizedAction === 'start') return 'session_start';
  if (normalizedAction === 'end') return 'session_end';
  return 'page_visit';
}

function dayKeyUTC(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

type Pending = {
  resolve: (v: any) => void;
  reject: (e: any) => void;
};

const buffer: TrackingEventPayload[] = [];
const pending = new Map<string, Pending>();
let flushTimer: NodeJS.Timeout | null = null;
let flushing = false;

const FLUSH_INTERVAL_MS = Number(process.env.TRACKING_FLUSH_INTERVAL_MS ?? 1000);
const MAX_BATCH_SIZE = Number(process.env.TRACKING_MAX_BATCH_SIZE ?? 200);

async function flushOnce() {
  if (flushing) return;
  if (buffer.length === 0) return;

  flushing = true;

  // Take a fixed-size batch; any remaining events stay buffered.
  const batch = buffer.splice(0, MAX_BATCH_SIZE);
  const batchEventIds = batch.map((e) => e.eventId);

  const pendingWaiters = batchEventIds
    .map((id) => {
      const p = pending.get(id);
      if (!p) return null;
      return [id, p] as const;
    })
    .filter(Boolean) as Array<readonly [string, Pending]>;

  const markAll = (fn: 'resolve' | 'reject', value: any) => {
    for (const [eventId, waiter] of pendingWaiters) {
      try {
        if (fn === 'resolve') waiter.resolve(value);
        else waiter.reject(value);
      } catch {
        // ignore
      }
      pending.delete(eventId);
    }
  };

  try {
    await connectDB();

    // ── 1) TrackingLog upserts (raw processed events + idempotency) ──
    const trackingOps = batch.map((e) => ({
      updateOne: {
        filter: { eventId: e.eventId },
        update: {
          $setOnInsert: {
            eventId: e.eventId,
            userId: e.userId ? toObjectId(e.userId) : undefined,
            sessionId: e.sessionId,
            eventType: e.normalizedAction,
            page: e.page,
            previousPage: e.previousPage,
            ipAddress: e.ipAddress,
            timestamp: new Date(e.timestamp),
            country: e.country,
            state: e.state,
            city: e.city,
            district: e.district,
            userAgent: e.userAgent,
          },
        },
        upsert: true,
      },
    }));

    const trackingBulkRes: any = await TrackingLog.bulkWrite(trackingOps, { ordered: false });
    const upsertedIds: Record<string, unknown> | undefined = trackingBulkRes?.upsertedIds;
    const insertedByIndex = new Set<number>(
      upsertedIds ? Object.keys(upsertedIds).map((i) => Number(i)).filter((n) => Number.isFinite(n)) : []
    );

    // ── 2) Session updates (atomic upsert + concurrency-safe) ──
    // Pipeline update: uses existing doc fields to decide currentPageSince.
    const sessionOps = batch.map((e) => {
      const now = new Date(e.timestamp);
      const isEnd = e.normalizedAction === 'end';
      const page = e.page;

      const baseSet: any = {
        userId: toObjectId(e.userId),
        sessionId: e.sessionId,
        lastSeen: now,
        loginTime: { $ifNull: ['$loginTime', now] },
        currentPage: page,
        currentPageSince: {
          $cond: [
            { $ne: ['$currentPage', page] },
            now,
            { $ifNull: ['$currentPageSince', now] },
          ],
        },
        isActive: !isEnd,
      };

      if (isEnd) {
        baseSet.logoutTime = now;
        baseSet.durationSeconds = {
          $round: [
            {
              $divide: [
                { $subtract: [now, { $ifNull: ['$loginTime', now] }] },
                1000,
              ],
            },
            0,
          ],
        };
      } else {
        // Clear logout markers when user comes back.
        baseSet.logoutTime = null;
      }

      if (e.ipAddress) baseSet.ipAddress = e.ipAddress;
      if (e.userAgent) baseSet.userAgent = e.userAgent;
      if (e.country) baseSet.country = e.country;
      if (e.state) baseSet.state = e.state;
      if (e.city) baseSet.city = e.city;
      if (typeof e.distanceFromAdmin === 'number') baseSet.distanceFromAdmin = e.distanceFromAdmin;

      return {
        updateOne: {
          filter: { userId: toObjectId(e.userId), sessionId: e.sessionId },
          update: [{ $set: baseSet }],
          upsert: true,
        },
      };
    });

    await UserSession.bulkWrite(sessionOps, { ordered: false });

    // ── 3) Activity timelines/logs (idempotent by eventId) ──
    const timelineOps = batch.map((e) => ({
      updateOne: {
        filter: { eventId: e.eventId },
        update: {
          $setOnInsert: {
            eventId: e.eventId,
            userId: toObjectId(e.userId),
            sessionId: e.sessionId,
            action: timelineActionFor(e.normalizedAction),
            page: e.page,
            previousPage: e.previousPage,
            timestamp: new Date(e.timestamp),
          },
        },
        upsert: true,
      },
    }));

    const activityOps = batch.map((e) => ({
      updateOne: {
        filter: { eventId: e.eventId },
        update: {
          $setOnInsert: {
            eventId: e.eventId,
            userId: toObjectId(e.userId),
            sessionId: e.sessionId,
            page: e.page,
            ipAddress: e.ipAddress,
            timestamp: new Date(e.timestamp),
          },
        },
        upsert: true,
      },
    }));

    await Promise.all([
      ActivityTimeline.bulkWrite(timelineOps, { ordered: false }),
      ActivityLog.bulkWrite(activityOps, { ordered: false }),
    ]);

    // ── 4) Aggregated metrics (best-effort from newly inserted events) ──
    // Heatmap uses this, but it can fall back to raw TrackingLog if stats are stale.
    const statsOps = batch
      .map((e, idx) => {
        if (!insertedByIndex.has(idx)) return null;
        const now = new Date(e.timestamp);
        return {
          updateOne: {
            filter: { page: e.page || '/', day: dayKeyUTC(now) },
            update: { $inc: { visits: 1 } },
            upsert: true,
          },
        };
      })
      .filter(Boolean) as any[];

    if (statsOps.length > 0) {
      await TrackingPageStatsDaily.bulkWrite(statsOps, { ordered: false });
    }

    const redis = getRedis();
    redis
      .pipeline()
      .incrby('tracking:events:processed', batch.length)
      .exec()
      .catch(() => {});

    if (process.env.NODE_ENV !== 'test') {
      logInfo('tracking:batch_flushed', {
        queue: TRACKING_QUEUE,
        batchSize: batch.length,
        uniqueInserted: insertedByIndex.size,
      });
    }

    markAll('resolve', { ok: true });
  } catch (err) {
    logError('tracking:batch_flush_failed', err, {
      queue: TRACKING_QUEUE,
      batchSize: buffer.length,
    });
    markAll('reject', err);
  } finally {
    flushing = false;
    // If we still have buffered events, schedule another flush ASAP.
    if (buffer.length > 0 && !flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        flushOnce().catch(() => {});
      }, 0);
    }
  }
}

async function processTrackingJob(job: Job<TrackingEventPayload>) {
  const e = job.data;
  return new Promise((resolve, reject) => {
    pending.set(e.eventId, { resolve, reject });
    buffer.push(e);

    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        flushOnce().catch((err) => {
          // If flushOnce throws before rejecting promises, resolve nothing here.
          logError('tracking:flush_timer_error', err);
        });
      }, FLUSH_INTERVAL_MS);
    }

    if (buffer.length >= MAX_BATCH_SIZE) {
      // Trigger flush immediately. The flushOnce call will drain only MAX_BATCH_SIZE.
      flushOnce().catch((err) => logError('tracking:flush_immediate_error', err));
    }
  });
}

export function startTrackingWorker({ concurrency = 20 }: { concurrency?: number } = {}) {
  const worker = new Worker(TRACKING_QUEUE, processTrackingJob as any, {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    concurrency,
  });

  if (process.env.NODE_ENV !== 'test') {
    worker.on('ready', () => logInfo('tracking:worker_ready', { queue: TRACKING_QUEUE }));
  }
  worker.on('failed', (job, err) => logError('tracking:job_failed', err, { jobId: job?.id }));
  worker.on('stalled', (jobId: string) =>
    logError('tracking:job_stalled', new Error('stalled'), { jobId })
  );

  // Backlog monitor
  const backlogIntervalMs = Number(process.env.TRACKING_BACKLOG_CHECK_MS ?? 15_000);
  const backlogIntervalHandle = setInterval(async () => {
    try {
      const queue = (worker as unknown as { queue: Queue }).queue;
      const waiting = await queue.getWaitingCount();
      const active = await queue.getActiveCount();
      const delayed = await queue.getDelayedCount();
      const threshold = Number(process.env.TRACKING_BACKLOG_ALERT_THRESHOLD ?? 5000);
      redisAlertIfHigh(waiting + active + delayed, threshold);
    } catch {
      // ignore
    }
  }, backlogIntervalMs);
  backlogIntervalHandle.unref?.();

  // Ensure unit tests and controlled shutdowns don't keep the event loop alive.
  // BullMQ's `worker.close()` should close its connections, but we also clear
  // our local interval + pending flush timers.
  const originalClose = worker.close.bind(worker);
  worker.close = (async () => {
    try {
      clearInterval(backlogIntervalHandle);
    } catch {
      // ignore
    }
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    return await originalClose();
  }) as any;

  return worker;
}

async function redisAlertIfHigh(value: number, threshold: number) {
  if (value < threshold) return;
  const redis = getRedis();
  redis
    .incrby('tracking:alerts:backlog_high', 1)
    .catch(() => {});
  console.warn(`[tracking] backlog high: ${value} >= ${threshold}`);
}

if (process.env.TRACKING_WORKER_START !== 'false') {
  try {
    startTrackingWorker();
  } catch (e) {
    logError('tracking:worker_start_failed', e);
  }
}

