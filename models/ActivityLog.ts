import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  eventId?: string;
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  page: string;
  ipAddress?: string;
  timestamp: Date;
  timeSpentSeconds?: number;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  // Optional for backward compatibility; new queued writes will set it and
  // enforce idempotency via the unique index.
  eventId: { type: String, index: true, unique: true, sparse: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  page: { type: String, required: true },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  timeSpentSeconds: { type: Number, default: 0 },
}, { timestamps: false });

ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: -1 });

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
