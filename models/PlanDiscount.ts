import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanDiscount extends Document {
  planId: string; // e.g. 'free' | 'pro' | 'enterprise'
  label?: string;
  percentage: number; // 0–100
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlanDiscountSchema = new Schema<IPlanDiscount>(
  {
    planId: { type: String, required: true },
    label: { type: String },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
  },
  { timestamps: true }
);

PlanDiscountSchema.index({ planId: 1, startsAt: 1, endsAt: 1 });
PlanDiscountSchema.index({ endsAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { endsAt: { $lt: new Date() } } });

export default mongoose.models.PlanDiscount ||
  mongoose.model<IPlanDiscount>('PlanDiscount', PlanDiscountSchema);

