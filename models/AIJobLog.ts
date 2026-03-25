import mongoose, { Schema, Document } from 'mongoose';

export interface IAIJobLog extends Document {
  jobType: 'prediction' | 'training' | 'support_ai';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  queueJobId?: string;
  userId?: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const AIJobLogSchema = new Schema<IAIJobLog>(
  {
    jobType: { type: String, enum: ['prediction', 'training', 'support_ai'], required: true, index: true },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued', index: true },
    queueJobId: { type: String, index: true },
    userId: { type: String, index: true },
    input: { type: Schema.Types.Mixed, default: {} },
    output: { type: Schema.Types.Mixed, default: {} },
    error: { type: String },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AIJobLogSchema.index({ jobType: 1, createdAt: -1 });

export default mongoose.models.AIJobLog || mongoose.model<IAIJobLog>('AIJobLog', AIJobLogSchema);
