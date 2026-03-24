import mongoose, { Schema, Document } from 'mongoose';

export type FunnelStep =
  | 'pricing_visit'
  | 'plan_selected'
  | 'payment_initiated'
  | 'payment_success'
  | 'payment_failed';

export interface IFunnelEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  step: FunnelStep;
  plan?: string;
  amount?: number;
  meta?: Record<string, unknown>;
  timestamp: Date;
}

const FunnelEventSchema = new Schema<IFunnelEvent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true },
  step: {
    type: String,
    enum: ['pricing_visit', 'plan_selected', 'payment_initiated', 'payment_success', 'payment_failed'],
    required: true,
    index: true,
  },
  plan: { type: String },
  amount: { type: Number },
  meta: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});

FunnelEventSchema.index({ step: 1, timestamp: -1 });
FunnelEventSchema.index({ userId: 1, step: 1 });

export default mongoose.models.FunnelEvent ||
  mongoose.model<IFunnelEvent>('FunnelEvent', FunnelEventSchema);
