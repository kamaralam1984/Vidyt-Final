import mongoose, { Schema, Document } from 'mongoose';

export interface IAIModelVersion extends Document {
  version: string;
  path: string;
  status: 'training' | 'ready' | 'failed';
  isActive?: boolean;
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  trainedAt: Date;
  metricsId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AIModelVersionSchema = new Schema<IAIModelVersion>(
  {
    version: { type: String, required: true, unique: true },
    path: { type: String, required: true },
    status: { type: String, enum: ['training', 'ready', 'failed'], default: 'training' },
    isActive: { type: Boolean, default: false, index: true },
    epochs: { type: Number, default: 50 },
    batchSize: { type: Number, default: 32 },
    learningRate: { type: Number, default: 0.001 },
    validationSplit: { type: Number, default: 0.2 },
    trainedAt: { type: Date, default: Date.now },
    metricsId: { type: Schema.Types.ObjectId, ref: 'TrainingMetrics' },
  },
  { timestamps: true }
);

export default mongoose.models.AIModelVersion || mongoose.model<IAIModelVersion>('AIModelVersion', AIModelVersionSchema);
