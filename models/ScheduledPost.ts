import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledPost extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  scheduledAt: Date;
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled';
  postedAt?: Date;
  hashtags: string[];
  metadata?: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledPostSchema = new Schema<IScheduledPost>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String },
  thumbnailUrl: { type: String },
  platform: { type: String, required: true, enum: ['youtube', 'facebook', 'instagram', 'tiktok'], index: true },
  scheduledAt: { type: Date, required: true, index: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'posted', 'failed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  postedAt: { type: Date },
  hashtags: [{ type: String }],
  metadata: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

ScheduledPostSchema.index({ userId: 1, scheduledAt: 1 });
ScheduledPostSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.models.ScheduledPost || mongoose.model<IScheduledPost>('ScheduledPost', ScheduledPostSchema);
