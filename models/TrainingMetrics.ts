import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingMetrics extends Document {
  modelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  loss: number;
  valAccuracy: number;
  valLoss: number;
  epochsRun: number;
  samplesUsed: number;
  createdAt: Date;
}

const TrainingMetricsSchema = new Schema<ITrainingMetrics>(
  {
    modelVersion: { type: String, required: true, index: true },
    accuracy: { type: Number, default: 0 },
    precision: { type: Number, default: 0 },
    recall: { type: Number, default: 0 },
    f1Score: { type: Number, default: 0 },
    loss: { type: Number, default: 0 },
    valAccuracy: { type: Number, default: 0 },
    valLoss: { type: Number, default: 0 },
    epochsRun: { type: Number, default: 0 },
    samplesUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.TrainingMetrics || mongoose.model<ITrainingMetrics>('TrainingMetrics', TrainingMetricsSchema);
