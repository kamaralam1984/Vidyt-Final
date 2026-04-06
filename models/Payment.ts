import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string;
  paymentId?: string;
  plan: string;
  billingPeriod: 'month' | 'year';
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  gateway: 'razorpay' | 'paypal' | 'manual';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: String, required: true, index: true },
  paymentId: { type: String },
  plan: { type: String, required: true, index: true },
  billingPeriod: { type: String, enum: ['month', 'year'], default: 'month' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending', index: true },
  gateway: { type: String, enum: ['razorpay', 'paypal', 'manual'], default: 'razorpay' },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ plan: 1, status: 1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
