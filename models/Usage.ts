import mongoose, { Schema, Document } from 'mongoose';

export interface IUsage extends Document {
  userId: mongoose.Types.ObjectId;
  feature: string;
  count: number;
  date: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
}

const UsageSchema = new Schema<IUsage>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  feature: { type: String, required: true, index: true },
  count: { type: Number, default: 0 },
  date: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

// Compound index for fast lookups
UsageSchema.index({ userId: 1, feature: 1, date: 1 }, { unique: true });

if (mongoose.models.Usage) {
  delete mongoose.models.Usage;
}

export default mongoose.model<IUsage>('Usage', UsageSchema);
