import mongoose, { Schema, Document } from 'mongoose';

export interface ITrackingLog extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  page: string;
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
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, required: true, index: true },
  page: { type: String, required: true },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  timeSpentSeconds: { type: Number, default: 0 },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  district: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

TrackingLogSchema.index({ userId: 1, timestamp: -1 });
TrackingLogSchema.index({ sessionId: 1, timestamp: -1 });

export default mongoose.models.TrackingLog || mongoose.model<ITrackingLog>('TrackingLog', TrackingLogSchema);
