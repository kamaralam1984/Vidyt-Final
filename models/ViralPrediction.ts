import mongoose, { Schema, Document } from 'mongoose';

export interface IViralPrediction extends Document {
  userId?: string;
  videoId?: string;
  features: {
    hookScore: number;
    thumbnailScore: number;
    titleScore: number;
    trendingScore: number;
    videoDuration: number;
    engagementRate: number;
    growthVelocity: number;
    commentVelocity: number;
    likeRatio: number;
    uploadTimingScore: number;
  };
  nnScore: number;
  ruleScore: number;
  historicalScore: number;
  viralProbability: number;
  confidence: number;
  insights: string[];
  modelVersion: string;
  createdAt: Date;
}

const ViralPredictionSchema = new Schema<IViralPrediction>(
  {
    userId: { type: String, index: true },
    videoId: { type: String, index: true },
    features: {
      hookScore: { type: Number, default: 0 },
      thumbnailScore: { type: Number, default: 0 },
      titleScore: { type: Number, default: 0 },
      trendingScore: { type: Number, default: 0 },
      videoDuration: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
      growthVelocity: { type: Number, default: 0 },
      commentVelocity: { type: Number, default: 0 },
      likeRatio: { type: Number, default: 0 },
      uploadTimingScore: { type: Number, default: 0 },
    },
    nnScore: { type: Number, default: 0 },
    ruleScore: { type: Number, default: 0 },
    historicalScore: { type: Number, default: 0 },
    viralProbability: { type: Number, required: true },
    confidence: { type: Number, default: 0 },
    insights: [{ type: String }],
    modelVersion: { type: String, default: 'v0' },
  },
  { timestamps: true }
);

ViralPredictionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.ViralPrediction || mongoose.model<IViralPrediction>('ViralPrediction', ViralPredictionSchema);
