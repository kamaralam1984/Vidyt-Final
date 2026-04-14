export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getRedisOptions } from '@/lib/redis';
import { getQueue } from '@/lib/queue';

// ── Backup Log Model (reuse) ──
const BackupLogSchema = new mongoose.Schema({
  type: { type: String },
  status: { type: String },
  fileName: String,
  size: Number,
  collections: [String],
  documentCount: Number,
  createdBy: String,
  completedAt: Date,
  error: String,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
const BackupLog = mongoose.models.BackupLog || mongoose.model('BackupLog', BackupLogSchema);

// ── Error Log Model (reuse) ──
const ErrorLogSchema = new mongoose.Schema({
  type: { type: String },
  message: String,
  route: String,
  statusCode: Number,
  resolved: { type: Boolean, default: false },
}, { timestamps: true });
const ErrorLog = mongoose.models.ErrorLog || mongoose.model('ErrorLog', ErrorLogSchema);

// ── Helpers ──
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

async function getQueueStats(queueName: string) {
  try {
    const q = getQueue(queueName);
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
      q.getDelayedCount(),
      q.getPausedCount(),
    ]);
    const isPaused = await q.isPaused();
    return { name: queueName, waiting, active, completed, failed, delayed, paused, isPaused, error: null };
  } catch (err: any) {
    return { name: queueName, waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0, isPaused: false, error: err.message };
  }
}

async function getRedisInfo() {
  try {
    const IORedis = (await import('ioredis')).default;
    const opts = getRedisOptions();
    const redis = new IORedis({ ...opts, connectTimeout: 3000, lazyConnect: true });
    await redis.connect();
    const info = await redis.info();
    await redis.quit();

    const parseField = (field: string) => {
      const match = info.match(new RegExp(`${field}:(\\S+)`));
      return match ? match[1] : null;
    };

    return {
      connected: true,
      version: parseField('redis_version'),
      usedMemory: parseField('used_memory_human'),
      connectedClients: parseInt(parseField('connected_clients') || '0'),
      totalCommandsProcessed: parseInt(parseField('total_commands_processed') || '0'),
      keyspaceHits: parseInt(parseField('keyspace_hits') || '0'),
      keyspaceMisses: parseInt(parseField('keyspace_misses') || '0'),
      uptimeSeconds: parseInt(parseField('uptime_in_seconds') || '0'),
    };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

async function getDbCollectionStats() {
  try {
    const db = mongoose.connection.db;
    if (!db) return [];

    const collections = await db.listCollections().toArray();
    const stats = await Promise.all(
      collections.map(async (col) => {
        try {
          const stat = await db.command({ collStats: col.name, scale: 1024 });
          return {
            name: col.name,
            count: stat.count || 0,
            size: formatBytes((stat.size || 0) * 1024),
            storageSize: formatBytes((stat.storageSize || 0) * 1024),
            avgObjSize: stat.avgObjSize ? formatBytes(stat.avgObjSize) : '—',
            indexCount: stat.nindexes || 0,
            indexSize: formatBytes((stat.totalIndexSize || 0) * 1024),
          };
        } catch {
          return { name: col.name, count: 0, size: '—', storageSize: '—', avgObjSize: '—', indexCount: 0, indexSize: '—' };
        }
      })
    );
    return stats.sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

// ── GET: Full backend dashboard ──
export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'full';

  if (action === 'full') {
    const mem = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const [
      aiQueueStats,
      postingQueueStats,
      redisInfo,
      collectionStats,
      totalErrors,
      unresolvedErrors,
      errorsByType,
      totalBackups,
      lastBackup,
      recentErrors,
    ] = await Promise.all([
      getQueueStats(process.env.AI_QUEUE_NAME || 'ai-jobs'),
      getQueueStats(process.env.POSTING_QUEUE_NAME || 'video-posting'),
      getRedisInfo(),
      getDbCollectionStats(),
      ErrorLog.countDocuments({}),
      ErrorLog.countDocuments({ resolved: false }),
      ErrorLog.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 }, unresolved: { $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      BackupLog.countDocuments({}),
      BackupLog.findOne({ status: 'completed' }).sort({ createdAt: -1 }).lean(),
      ErrorLog.find({ resolved: false }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const dbState = mongoose.connection.readyState;
    const dbStateMap: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    // Compute db stats summary
    const totalDocs = collectionStats.reduce((sum, c) => sum + c.count, 0);

    return NextResponse.json({
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: Math.floor(process.uptime()),
        memory: {
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          rss: Math.round(mem.rss / 1024 / 1024),
          external: Math.round(mem.external / 1024 / 1024),
          heapPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000),
          system: Math.round(cpuUsage.system / 1000),
        },
      },
      database: {
        status: dbStateMap[dbState] || 'unknown',
        readyState: dbState,
        host: mongoose.connection.host || 'localhost',
        name: mongoose.connection.name || '—',
        collections: collectionStats,
        totalDocuments: totalDocs,
        totalCollections: collectionStats.length,
      },
      redis: redisInfo,
      queues: [aiQueueStats, postingQueueStats],
      errors: {
        total: totalErrors,
        unresolved: unresolvedErrors,
        byType: errorsByType,
        recent: recentErrors,
      },
      backups: {
        total: totalBackups,
        last: lastBackup,
      },
    });
  }

  if (action === 'collections') {
    const stats = await getDbCollectionStats();
    return NextResponse.json({ collections: stats });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// ── POST: Queue & System actions ──
export async function POST(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const body = await request.json();
  const { action } = body;

  // Pause a queue
  if (action === 'pause-queue') {
    try {
      const q = getQueue(body.queueName);
      await q.pause();
      return NextResponse.json({ success: true, message: `Queue "${body.queueName}" paused` });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Resume a queue
  if (action === 'resume-queue') {
    try {
      const q = getQueue(body.queueName);
      await q.resume();
      return NextResponse.json({ success: true, message: `Queue "${body.queueName}" resumed` });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Drain (clear waiting jobs) a queue
  if (action === 'drain-queue') {
    try {
      const q = getQueue(body.queueName);
      await q.drain();
      return NextResponse.json({ success: true, message: `Queue "${body.queueName}" drained` });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Clean failed jobs
  if (action === 'clean-failed') {
    try {
      const q = getQueue(body.queueName);
      const removed = await q.clean(0, 1000, 'failed');
      return NextResponse.json({ success: true, removed: removed.length });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Create backup (reuse system route logic)
  if (action === 'create-backup') {
    const backupType = body.type || 'full';
    const collectionsMap: Record<string, string[]> = {
      full: ['users', 'payments', 'plans', 'platformcontrols', 'apiconfigs', 'sitesettings', 'subscriptions'],
      users: ['users'],
      payments: ['payments'],
      plans: ['plans'],
      settings: ['platformcontrols', 'apiconfigs', 'sitesettings'],
    };
    const collections = collectionsMap[backupType] || collectionsMap.full;
    const backupLog = await BackupLog.create({ type: backupType, status: 'running', collections, createdBy: authUser.name || authUser.email || 'Super Admin' });

    try {
      const db = mongoose.connection.db;
      if (!db) throw new Error('DB not connected');
      const backupData: Record<string, any[]> = {};
      let totalDocs = 0;
      for (const col of collections) {
        try {
          const docs = await db.collection(col).find({}).limit(10000).toArray();
          backupData[col] = docs;
          totalDocs += docs.length;
        } catch { backupData[col] = []; }
      }
      const sizeBytes = Buffer.byteLength(JSON.stringify(backupData), 'utf8');
      await BackupLog.findByIdAndUpdate(backupLog._id, {
        status: 'completed', completedAt: new Date(), documentCount: totalDocs,
        size: sizeBytes, fileName: `backup_${backupType}_${new Date().toISOString().slice(0, 10)}.json`, data: backupData,
      });
      return NextResponse.json({ success: true, backupId: backupLog._id, documents: totalDocs, size: formatBytes(sizeBytes) });
    } catch (err: any) {
      await BackupLog.findByIdAndUpdate(backupLog._id, { status: 'failed', error: err.message });
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Download backup
  if (action === 'download-backup') {
    const backup = await BackupLog.findById(body.backupId).lean() as any;
    if (!backup) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, fileName: backup.fileName || 'backup.json', data: backup.data || {} });
  }

  // Restore backup
  if (action === 'restore-backup') {
    const backup = await BackupLog.findById(body.backupId).lean() as any;
    if (!backup?.data) return NextResponse.json({ error: 'Backup not found or empty' }, { status: 404 });
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 });
    const results: Record<string, any> = {};
    for (const col of Object.keys(backup.data)) {
      const docs = backup.data[col];
      if (!Array.isArray(docs) || docs.length === 0) continue;
      try {
        const c = db.collection(col);
        const del = await c.deleteMany({});
        const ins = await c.insertMany(docs);
        results[col] = { deleted: del.deletedCount, inserted: ins.insertedCount };
      } catch (e: any) { results[col] = { error: e.message }; }
    }
    return NextResponse.json({ success: true, results });
  }

  // Resolve all errors
  if (action === 'resolve-all-errors') {
    const result = await ErrorLog.updateMany({ resolved: false }, {
      $set: { resolved: true, resolvedAt: new Date(), resolvedBy: authUser.name || 'Super Admin', resolution: 'Bulk resolved from Backend Control' },
    });
    return NextResponse.json({ success: true, count: result.modifiedCount });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
