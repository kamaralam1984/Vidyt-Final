import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanDiscount extends Document {
  planId: string;
  label?: string;
  couponCode?: string;
  percentage: number;       // 0–100
  billingPeriod: 'monthly' | 'yearly' | 'both';
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  maxUses?: number;         // 0 = unlimited
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanDiscountSchema = new Schema<IPlanDiscount>(
  {
    planId: { type: String, required: true },
    label: { type: String },
    couponCode: { type: String, uppercase: true, trim: true },
    percentage: { type: Number, required: true, min: 1, max: 100 },
    billingPeriod: { type: String, enum: ['monthly', 'yearly', 'both'], default: 'both' },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    maxUses: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PlanDiscountSchema.index({ planId: 1, startsAt: 1, endsAt: 1 });
PlanDiscountSchema.index({ couponCode: 1 }, { unique: true, sparse: true });
PlanDiscountSchema.index({ isActive: 1, endsAt: 1 });

export default mongoose.models.PlanDiscount ||
  mongoose.model<IPlanDiscount>('PlanDiscount', PlanDiscountSchema);
