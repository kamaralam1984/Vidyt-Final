import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityTimeline extends Document {
  eventId: string;
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  action: 'page_visit' | 'session_start' | 'session_end' | 'payment_step';
  page: string;
  previousPage?: string;
  timeSpentSeconds?: number;
  meta?: Record<string, unknown>;
  timestamp: Date;
}

const ActivityTimelineSchema = new Schema<IActivityTimeline>({
  eventId: { type: String, required: true, unique: true, sparse: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  action: { type: String, enum: ['page_visit', 'session_start', 'session_end', 'payment_step'], default: 'page_visit' },
  page: { type: String, required: true },
  previousPage: { type: String },
  timeSpentSeconds: { type: Number, default: 0 },
  meta: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});

ActivityTimelineSchema.index({ userId: 1, timestamp: -1 });
ActivityTimelineSchema.index({ sessionId: 1, timestamp: 1 });

export default mongoose.models.ActivityTimeline ||
  mongoose.model<IActivityTimeline>('ActivityTimeline', ActivityTimelineSchema);
