import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'free' | 'starter' | 'pro' | 'enterprise' | 'custom' | 'owner';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  paymentMethod?: {
    type: 'stripe' | 'paypal' | 'razorpay';
    customerId: string;
    subscriptionId: string;
  };
  billingHistory: Array<{
    amount: number;
    currency: string;
    date: Date;
    invoiceId: string;
    status: 'paid' | 'pending' | 'failed';
  }>;
  usage: {
    videosThisMonth: number;
    analysesThisMonth: number;
    competitorsTracked: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise', 'custom', 'owner'], required: true, index: true },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'trial'], default: 'active', index: true },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  trialEnd: { type: Date },
  paymentMethod: {
    type: { type: String, enum: ['paypal', 'razorpay'] },
    customerId: String,
    subscriptionId: String,
  },
  billingHistory: [{
    amount: Number,
    currency: { type: String, default: 'USD' },
    date: Date,
    invoiceId: String,
    status: { type: String, enum: ['paid', 'pending', 'failed'] },
  }],
  usage: {
    videosThisMonth: { type: Number, default: 0 },
    analysesThisMonth: { type: Number, default: 0 },
    competitorsTracked: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
