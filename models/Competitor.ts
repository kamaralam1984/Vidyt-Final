import mongoose, { Schema, Document } from 'mongoose';

export interface ICompetitor extends Document {
  userId: string;
  competitorId: string; // Platform-specific ID
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  channelName: string;
  channelUrl: string;
  trackedVideos: mongoose.Types.ObjectId[];
  lastAnalyzed: Date;
  topPerformers: mongoose.Types.ObjectId[]; // Top performing videos
  averageEngagementRate: number;
  averageViews: number;
  bestPostingTimes: Array<{ day: string; hour: number; score: number }>;
  successfulPatterns: {
    titles: string[];
    hashtags: string[];
    videoLengths: number[];
    categories: string[];
  };
  growthRate: number;
  followerCount?: number;
  metadata: {
    [key: string]: any;
  };
}

const CompetitorSchema = new Schema<ICompetitor>({
  userId: { type: String, required: true, index: true },
  competitorId: { type: String, required: true, index: true },
  platform: { type: String, required: true, index: true },
  channelName: { type: String, required: true },
  channelUrl: { type: String, required: true },
  trackedVideos: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  lastAnalyzed: { type: Date, default: Date.now, index: true },
  topPerformers: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  averageEngagementRate: { type: Number, default: 0 },
  averageViews: { type: Number, default: 0 },
  bestPostingTimes: [{
    day: String,
    hour: Number,
    score: Number,
  }],
  successfulPatterns: {
    titles: [{ type: String }],
    hashtags: [{ type: String }],
    videoLengths: [{ type: Number }],
    categories: [{ type: String }],
  },
  growthRate: { type: Number, default: 0 },
  followerCount: { type: Number },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

CompetitorSchema.index({ userId: 1, platform: 1 });
CompetitorSchema.index({ competitorId: 1, platform: 1 }, { unique: true });

export default mongoose.models.Competitor || mongoose.model<ICompetitor>('Competitor', CompetitorSchema);
