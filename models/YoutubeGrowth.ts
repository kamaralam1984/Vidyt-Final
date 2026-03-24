import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoSnapshot {
  videoId: string;
  title: string;
  views: number;
  publishedAt: Date;
  duration?: number;
  viralScore?: number;
}

export interface IYoutubeGrowth extends Document {
  userId: string;
  channelUrl: string;
  channelId?: string;
  channelTitle?: string;
  subscriberCount?: number;
  totalWatchTime?: number;
  totalLikes?: number;
  videos: IVideoSnapshot[];
  subscriberGrowthData?: { timestamp: Date; count: number }[];
  viewsGrowthData?: { timestamp: Date; views: number }[];
  aiInsights: string[];
  lastFetchedAt: Date;
  createdAt: Date;
}

const VideoSnapshotSchema = new Schema({
  videoId: { type: String, required: true },
  title: { type: String, default: '' },
  views: { type: Number, default: 0 },
  publishedAt: { type: Date, required: true },
  duration: { type: Number },
  viralScore: { type: Number },
}, { _id: false });

const YoutubeGrowthSchema = new Schema<IYoutubeGrowth>({
  userId: { type: String, required: true, index: true },
  channelUrl: { type: String, required: true },
  channelId: { type: String },
  channelTitle: { type: String },
  subscriberCount: { type: Number },
  totalWatchTime: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },
  videos: [VideoSnapshotSchema],
  subscriberGrowthData: [{ timestamp: { type: Date }, count: { type: Number } }],
  viewsGrowthData: [{ timestamp: { type: Date }, views: { type: Number } }],
  aiInsights: [{ type: String }],
  lastFetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

YoutubeGrowthSchema.index({ channelUrl: 1, userId: 1 });

export default mongoose.models.YoutubeGrowth || mongoose.model<IYoutubeGrowth>('YoutubeGrowth', YoutubeGrowthSchema);
