import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysis extends Document {
  videoId: mongoose.Types.ObjectId;
  hookScore: number;
  thumbnailScore: number;
  titleScore: number;
  viralProbability: number;
  confidenceLevel: number;
  hookAnalysis: {
    facesDetected: number;
    motionIntensity: number;
    sceneChanges: number;
    brightness: number;
  };
  thumbnailAnalysis: {
    facesDetected: number;
    emotion?: string;
    colorContrast: number;
    textReadability: number;
    suggestions: string[];
  };
  titleAnalysis: {
    keywords: string[];
    emotionalTriggers: string[];
    length: number;
    clickPotential: number;
    optimizedTitles: string[];
  };
  hashtags: string[];
  trendingTopics: Array<{
    keyword: string;
    score: number;
  }>;
  bestPostingTime: {
    day: string;
    hour: number;
    confidence: number;
  };
  priority?: 'normal' | 'high'; // high = Pro/Enterprise priority processing
  createdAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>({
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  hookScore: { type: Number, required: true, min: 0, max: 100 },
  thumbnailScore: { type: Number, required: true, min: 0, max: 100 },
  titleScore: { type: Number, required: true, min: 0, max: 100 },
  viralProbability: { type: Number, required: true, min: 0, max: 100 },
  confidenceLevel: { type: Number, required: true, min: 0, max: 100 },
  hookAnalysis: {
    facesDetected: { type: Number, default: 0 },
    motionIntensity: { type: Number, default: 0 },
    sceneChanges: { type: Number, default: 0 },
    brightness: { type: Number, default: 0 },
  },
  thumbnailAnalysis: {
    facesDetected: { type: Number, default: 0 },
    emotion: { type: String },
    colorContrast: { type: Number, default: 0 },
    textReadability: { type: Number, default: 0 },
    suggestions: [{ type: String }],
  },
  titleAnalysis: {
    keywords: [{ type: String }],
    emotionalTriggers: [{ type: String }],
    length: { type: Number, default: 0 },
    clickPotential: { type: Number, default: 0 },
    optimizedTitles: [{ type: String }],
  },
  hashtags: [{ type: String }],
  trendingTopics: [{
    keyword: { type: String },
    score: { type: Number },
  }],
  bestPostingTime: {
    day: { type: String },
    hour: { type: Number },
    confidence: { type: Number },
  },
  priority: { type: String, enum: ['normal', 'high'], default: 'normal' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
