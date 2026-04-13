export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// ── Error Log Model ──
const ErrorLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['api', 'client', 'server', 'database', 'payment', 'ai'], required: true },
  message: { type: String, required: true },
  stack: String,
  route: String,
  userId: String,
  userAgent: String,
  statusCode: Number,
  metadata: mongoose.Schema.Types.Mixed,
  resolved: { type: Boolean, default: false },
  resolvedAt: Date,
  resolvedBy: String,
  resolution: String,
}, { timestamps: true });

ErrorLogSchema.index({ createdAt: -1 });
ErrorLogSchema.index({ resolved: 1 });
ErrorLogSchema.index({ type: 1 });

const ErrorLog = mongoose.models.ErrorLog || mongoose.model('ErrorLog', ErrorLogSchema);

// ── Backup Log Model ──
const BackupLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['full', 'users', 'payments', 'plans', 'settings'], required: true },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
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

// ── GET: Fetch errors, backups, system health ──
export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'dashboard';

  if (action === 'dashboard') {
    const [
      totalErrors,
      unresolvedErrors,
      recentErrors,
      errorsByType,
      totalBackups,
      lastBackup,
      recentBackups,
    ] = await Promise.all([
      ErrorLog.countDocuments({}),
      ErrorLog.countDocuments({ resolved: false }),
      ErrorLog.find({}).sort({ createdAt: -1 }).limit(20).lean(),
      ErrorLog.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 }, unresolved: { $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      BackupLog.countDocuments({}),
      BackupLog.findOne({ status: 'completed' }).sort({ createdAt: -1 }).lean(),
      BackupLog.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    // System health checks
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const memUsage = process.memoryUsage();

    return NextResponse.json({
      errors: {
        total: totalErrors,
        unresolved: unresolvedErrors,
        recent: recentErrors,
        byType: errorsByType,
      },
      backups: {
        total: totalBackups,
        last: lastBackup,
        recent: recentBackups,
      },
      system: {
        database: dbStatus,
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  }

  if (action === 'errors') {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const filter: any = {};
    const type = url.searchParams.get('type');
    const resolved = url.searchParams.get('resolved');
    if (type) filter.type = type;
    if (resolved === 'true') filter.resolved = true;
    if (resolved === 'false') filter.resolved = false;

    const [errors, total] = await Promise.all([
      ErrorLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ErrorLog.countDocuments(filter),
    ]);

    return NextResponse.json({ errors, total, page, totalPages: Math.ceil(total / limit) });
  }

  if (action === 'backups') {
    const backups = await BackupLog.find({}).sort({ createdAt: -1 }).limit(20).lean();
    return NextResponse.json({ backups });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// ── POST: Actions (log error, create backup, restore, resolve error) ──
export async function POST(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const body = await request.json();
  const { action } = body;

  // ── Log an error (also callable from frontend) ──
  if (action === 'log-error') {
    const entry = await ErrorLog.create({
      type: body.type || 'server',
      message: body.message || 'Unknown error',
      stack: body.stack,
      route: body.route,
      userId: body.userId,
      userAgent: body.userAgent,
      statusCode: body.statusCode,
      metadata: body.metadata,
    });
    return NextResponse.json({ success: true, id: entry._id });
  }

  // ── Resolve an error ──
  if (action === 'resolve-error') {
    const { errorId, resolution } = body;
    if (!errorId) return NextResponse.json({ error: 'errorId required' }, { status: 400 });

    await ErrorLog.findByIdAndUpdate(errorId, {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: authUser.name || authUser.email || 'Super Admin',
      resolution: resolution || 'Manually resolved',
    });
    return NextResponse.json({ success: true });
  }

  // ── Bulk resolve errors ──
  if (action === 'resolve-all') {
    const filter: any = { resolved: false };
    if (body.type) filter.type = body.type;

    const result = await ErrorLog.updateMany(filter, {
      $set: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: authUser.name || authUser.email || 'Super Admin',
        resolution: 'Bulk resolved',
      },
    });
    return NextResponse.json({ success: true, count: result.modifiedCount });
  }

  // ── Delete old errors ──
  if (action === 'clear-errors') {
    const days = body.days || 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await ErrorLog.deleteMany({ createdAt: { $lt: cutoff }, resolved: true });
    return NextResponse.json({ success: true, deleted: result.deletedCount });
  }

  // ── Create backup ──
  if (action === 'create-backup') {
    const backupType = body.type || 'full';
    const collectionsToBackup: Record<string, string[]> = {
      full: ['users', 'payments', 'plans', 'platformcontrols', 'apiconfigs', 'sitesettings', 'subscriptions'],
      users: ['users'],
      payments: ['payments'],
      plans: ['plans'],
      settings: ['platformcontrols', 'apiconfigs', 'sitesettings'],
    };

    const collections = collectionsToBackup[backupType] || collectionsToBackup.full;

    const backupLog = await BackupLog.create({
      type: backupType,
      status: 'running',
      collections,
      createdBy: authUser.name || authUser.email || 'Super Admin',
    });

    try {
      const db = mongoose.connection.db;
      if (!db) throw new Error('Database not connected');

      const backupData: Record<string, any[]> = {};
      let totalDocs = 0;

      for (const colName of collections) {
        try {
          const col = db.collection(colName);
          const docs = await col.find({}).limit(10000).toArray();
          backupData[colName] = docs;
          totalDocs += docs.length;
        } catch {
          backupData[colName] = [];
        }
      }

      const jsonStr = JSON.stringify(backupData);
      const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');

      await BackupLog.findByIdAndUpdate(backupLog._id, {
        status: 'completed',
        completedAt: new Date(),
        documentCount: totalDocs,
        size: sizeBytes,
        fileName: `backup_${backupType}_${new Date().toISOString().slice(0, 10)}.json`,
        data: backupData,
      });

      return NextResponse.json({
        success: true,
        backupId: backupLog._id,
        type: backupType,
        collections: collections.length,
        documents: totalDocs,
        size: `${(sizeBytes / 1024).toFixed(1)} KB`,
      });
    } catch (err: any) {
      await BackupLog.findByIdAndUpdate(backupLog._id, {
        status: 'failed',
        error: err.message,
      });
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Download backup ──
  if (action === 'download-backup') {
    const { backupId } = body;
    if (!backupId) return NextResponse.json({ error: 'backupId required' }, { status: 400 });

    const backup = await BackupLog.findById(backupId).lean();
    if (!backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      fileName: (backup as any).fileName || 'backup.json',
      data: (backup as any).data || {},
    });
  }

  // ── Restore from backup ──
  if (action === 'restore-backup') {
    const { backupId, collections: restoreCollections } = body;
    if (!backupId) return NextResponse.json({ error: 'backupId required' }, { status: 400 });

    const backup = await BackupLog.findById(backupId).lean() as any;
    if (!backup || !backup.data) return NextResponse.json({ error: 'Backup not found or has no data' }, { status: 404 });

    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ error: 'Database not connected' }, { status: 500 });

    const results: Record<string, { deleted: number; inserted: number }> = {};
    const collectionsToRestore = restoreCollections || Object.keys(backup.data);

    for (const colName of collectionsToRestore) {
      const docs = backup.data[colName];
      if (!docs || !Array.isArray(docs) || docs.length === 0) continue;

      try {
        const col = db.collection(colName);
        // Clear existing and insert backup data
        const deleteResult = await col.deleteMany({});
        const insertResult = await col.insertMany(docs);
        results[colName] = { deleted: deleteResult.deletedCount, inserted: insertResult.insertedCount };
      } catch (err: any) {
        results[colName] = { deleted: 0, inserted: 0 };
      }
    }

    return NextResponse.json({ success: true, results });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
