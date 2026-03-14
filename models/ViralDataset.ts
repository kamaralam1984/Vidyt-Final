import mongoose, { Schema, Document } from 'mongoose';

export interface IViralDataset extends Document {
  videoId: string;
  platform: 'youtube' | 'tiktok' | 'twitter' | 'reddit' | 'facebook' | 'instagram';
  title: string;
  description?: string;
  thumbnailUrl: string;
  hashtags: string[];
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  growthVelocity: number; // Views per hour
  postedAt: Date;
  collectedAt: Date;
  isViral: boolean; // Based on threshold
  viralThreshold: number;
  duration: number;
  hookScore?: number;
  thumbnailScore?: number;
  titleScore?: number;
  trendingScore?: number;
  metadata: {
    channelId?: string;
    channelName?: string;
    category?: string;
    language?: string;
    region?: string;
    [key: string]: any;
  };
  features: {
    hasFace: boolean;
    hasText: boolean;
    colorContrast: number;
    motionIntensity: number;
    sceneChanges: number;
    [key: string]: any;
  };
}

const ViralDatasetSchema = new Schema<IViralDataset>({
  videoId: { type: String, required: true, index: true },
  platform: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  thumbnailUrl: { type: String, required: true },
  hashtags: [{ type: String }],
  views: { type: Number, required: true, index: true },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  engagementRate: { type: Number, required: true, index: true },
  growthVelocity: { type: Number, required: true, index: true },
  postedAt: { type: Date, required: true, index: true },
  collectedAt: { type: Date, default: Date.now, index: true },
  isViral: { type: Boolean, default: false, index: true },
  viralThreshold: { type: Number, default: 10000 }, // Views threshold
  duration: { type: Number, required: true },
  hookScore: { type: Number },
  thumbnailScore: { type: Number },
  titleScore: { type: Number },
  trendingScore: { type: Number },
  metadata: { type: Schema.Types.Mixed, default: {} },
  features: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
ViralDatasetSchema.index({ platform: 1, isViral: 1, collectedAt: -1 });
ViralDatasetSchema.index({ growthVelocity: -1, collectedAt: -1 });
ViralDatasetSchema.index({ engagementRate: -1, collectedAt: -1 });

export default mongoose.models.ViralDataset || mongoose.model<IViralDataset>('ViralDataset', ViralDatasetSchema);
