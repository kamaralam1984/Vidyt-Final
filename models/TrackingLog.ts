import mongoose, { Schema, Document } from 'mongoose';

export interface ITrackingLog extends Document {
  eventId: string;
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  eventType?: string;
  page: string;
  previousPage?: string;
  ipAddress?: string;
  timestamp: Date;
  timeSpentSeconds?: number;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  userAgent?: string;
}

const TrackingLogSchema = new Schema<ITrackingLog>({
  eventId: { type: String, required: true, unique: true, sparse: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, required: true, index: true },
  eventType: { type: String },
  page: { type: String, required: true },
  previousPage: { type: String },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
  timeSpentSeconds: { type: Number, default: 0 },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  district: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

TrackingLogSchema.index({ userId: 1, timestamp: -1 });
TrackingLogSchema.index({ sessionId: 1, timestamp: -1 });
TrackingLogSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });
TrackingLogSchema.index({ createdAt: -1 });

// Optional TTL to control DB size.
// Enable by setting TRACKING_TTL_DAYS (default: 30). Set to 0 to disable TTL.
const ttlDays = Number(process.env.TRACKING_TTL_DAYS ?? 30);
if (ttlDays > 0) {
  TrackingLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: ttlDays * 24 * 60 * 60 });
}

export default mongoose.models.TrackingLog || mongoose.model<ITrackingLog>('TrackingLog', TrackingLogSchema);
