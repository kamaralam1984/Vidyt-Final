import mongoose, { Schema, Document } from 'mongoose';

export interface ITrendHistory extends Document {
  keyword: string;
  platform: 'youtube' | 'tiktok' | 'twitter' | 'reddit' | 'google' | 'all';
  trendScore: number; // 0-100
  growthVelocity: number; // Rate of growth
  timestamp: Date;
  region: string;
  category?: string;
  relatedKeywords: string[];
  peakScore?: number;
  peakTimestamp?: Date;
  lifecycle: 'emerging' | 'growing' | 'peak' | 'declining' | 'dead';
  metadata: {
    searchVolume?: number;
    competition?: number;
    [key: string]: any;
  };
}

const TrendHistorySchema = new Schema<ITrendHistory>({
  keyword: { type: String, required: true, index: true },
  platform: { type: String, required: true, index: true },
  trendScore: { type: Number, required: true, index: true },
  growthVelocity: { type: Number, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  region: { type: String, default: 'global', index: true },
  category: { type: String, index: true },
  relatedKeywords: [{ type: String }],
  peakScore: { type: Number },
  peakTimestamp: { type: Date },
  lifecycle: { 
    type: String, 
    enum: ['emerging', 'growing', 'peak', 'declining', 'dead'],
    default: 'emerging',
    index: true
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

// Compound indexes
TrendHistorySchema.index({ keyword: 1, platform: 1, timestamp: -1 });
TrendHistorySchema.index({ lifecycle: 1, growthVelocity: -1 });
TrendHistorySchema.index({ timestamp: -1, trendScore: -1 });

export default mongoose.models.TrendHistory || mongoose.model<ITrendHistory>('TrendHistory', TrendHistorySchema);
