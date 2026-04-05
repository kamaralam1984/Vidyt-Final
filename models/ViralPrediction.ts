import mongoose, { Schema, Document } from 'mongoose';

export interface IViralPrediction extends Document {
  userId?: string;
  videoId?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  platform?: string;
  category?: string;
  engagement?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  features: { [K: string]: number };
  nnScore: number;
  ruleScore: number;
  historicalScore: number;
  viralProbability: number;
  confidence: number;
  reasons: string[];
  weak_points: string[];
  improvements: string[];
  insights: string[];
  modelVersion: string;
  sourceProvider?: 'internal_ensemble' | 'python_ml';
  /**
   * Verified post-hoc outcome (views/engagement after publish + sync).
   * NOT the same as `engagement` at prediction time.
   */
  outcome?: {
    viralScore0to100: number;
    views: number;
    likes: number;
    comments: number;
    capturedAt: Date;
    source: 'youtube_api' | 'user_submitted' | 'admin' | 'cron_sync';
    notes?: string;
  };
  createdAt: Date;
}

const ViralPredictionSchema = new Schema<IViralPrediction>(
  {
    userId: { type: String, index: true },
    videoId: { type: String, index: true },
    title: { type: String },
    description: { type: String },
    hashtags: [{ type: String }],
    platform: { type: String },
    category: { type: String },
    engagement: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },
    features: { type: Schema.Types.Mixed, default: {} },
    nnScore: { type: Number, default: 0 },
    ruleScore: { type: Number, default: 0 },
    historicalScore: { type: Number, default: 0 },
    viralProbability: { type: Number, required: true },
    confidence: { type: Number, default: 0 },
    reasons: [{ type: String }],
    weak_points: [{ type: String }],
    improvements: [{ type: String }],
    insights: [{ type: String }],
    modelVersion: { type: String, default: 'v0' },
    sourceProvider: { type: String, enum: ['internal_ensemble', 'python_ml'], default: 'internal_ensemble' },
    outcome: {
      viralScore0to100: { type: Number, min: 0, max: 100 },
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      capturedAt: { type: Date },
      source: {
        type: String,
        enum: ['youtube_api', 'user_submitted', 'admin', 'cron_sync'],
        // Outcome is attached post-hoc via /api/ai/outcome, so predictions created
        // by /api/ai/predict must be valid even without outcome attached yet.
        required: false,
      },
      notes: { type: String },
    },
  },
  { timestamps: true }
);

ViralPredictionSchema.index({ userId: 1, createdAt: -1 });
ViralPredictionSchema.index({ videoId: 1, platform: 1 });
ViralPredictionSchema.index({ 'outcome.capturedAt': -1 });

export default mongoose.models.ViralPrediction || mongoose.model<IViralPrediction>('ViralPrediction', ViralPredictionSchema);
