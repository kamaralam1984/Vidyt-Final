// Slow query / slow request log. Surface point on the super-admin Activity
// Log feed so DB hot-spots and slow API routes show up alongside errors.
// Writers: any code path that detects a slow operation can call
// `logSlowQuery({...})`. Currently no automatic capture — keep it opt-in
// so we don't burn writes on every request.

import mongoose, { Schema, Document } from 'mongoose';

export interface ISlowQuery extends Document {
  /** 'db' for a Mongo query, 'api' for an HTTP route, 'job' for a worker. */
  kind: 'db' | 'api' | 'job';
  label: string;
  durationMs: number;
  /** Threshold the call breached, if known. */
  thresholdMs?: number;
  route?: string;
  collection?: string;
  query?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const SlowQuerySchema = new Schema<ISlowQuery>(
  {
    kind: { type: String, enum: ['db', 'api', 'job'], required: true, index: true },
    label: { type: String, required: true },
    durationMs: { type: Number, required: true, index: true },
    thresholdMs: { type: Number },
    route: { type: String, index: true },
    collection: { type: String, index: true },
    query: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SlowQuerySchema.index({ createdAt: -1 });

export default (mongoose.models.SlowQuery as mongoose.Model<ISlowQuery>) ||
  mongoose.model<ISlowQuery>('SlowQuery', SlowQuerySchema);

/** Fire-and-forget writer. Errors are swallowed so logging never breaks the app. */
export async function logSlowQuery(entry: {
  kind: 'db' | 'api' | 'job';
  label: string;
  durationMs: number;
  thresholdMs?: number;
  route?: string;
  collection?: string;
  query?: Record<string, any>;
  metadata?: Record<string, any>;
}) {
  try {
    const SlowQuery = (await import('./SlowQuery')).default;
    await SlowQuery.create(entry);
  } catch {
    /* ignore */
  }
}
