import mongoose, { Schema, Document } from 'mongoose';

export interface IEngagementMetrics extends Document {
  videoId: mongoose.Types.ObjectId;
  timestamp: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  growthRate: number; // Percentage change from previous measurement
  retentionRate?: number; // Average watch time percentage
  dropOffPoints?: Array<{ time: number; percentage: number }>;
  audienceDemographics?: {
    ageGroups: Array<{ range: string; percentage: number }>;
    genders: Array<{ gender: string; percentage: number }>;
    regions: Array<{ region: string; percentage: number }>;
  };
}

const EngagementMetricsSchema = new Schema<IEngagementMetrics>({
  videoId: { type: Schema.Types.ObjectId, required: true, ref: 'Video', index: true },
  timestamp: { type: Date, required: true, index: true },
  views: { type: Number, required: true },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  engagementRate: { type: Number, required: true },
  growthRate: { type: Number, default: 0 },
  retentionRate: { type: Number },
  dropOffPoints: [{
    time: Number,
    percentage: Number,
  }],
  audienceDemographics: {
    ageGroups: [{
      range: String,
      percentage: Number,
    }],
    genders: [{
      gender: String,
      percentage: Number,
    }],
    regions: [{
      region: String,
      percentage: Number,
    }],
  },
}, {
  timestamps: true,
});

EngagementMetricsSchema.index({ videoId: 1, timestamp: -1 });
EngagementMetricsSchema.index({ timestamp: -1 });

export default mongoose.models.EngagementMetrics || mongoose.model<IEngagementMetrics>('EngagementMetrics', EngagementMetricsSchema);
