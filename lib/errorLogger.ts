/**
 * Lightweight error logger that stores errors in MongoDB.
 * Use in API routes: try/catch → logError()
 */

import connectDB from './mongodb';
import mongoose from 'mongoose';

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

const ErrorLog = mongoose.models.ErrorLog || mongoose.model('ErrorLog', ErrorLogSchema);

export async function logError(opts: {
  type: 'api' | 'client' | 'server' | 'database' | 'payment' | 'ai';
  message: string;
  stack?: string;
  route?: string;
  userId?: string;
  statusCode?: number;
  metadata?: any;
}) {
  try {
    await connectDB();
    await ErrorLog.create(opts);
  } catch {
    // Don't let error logging break the app
    console.error('[ErrorLogger] Failed to log:', opts.message);
  }
}

export { ErrorLog };
