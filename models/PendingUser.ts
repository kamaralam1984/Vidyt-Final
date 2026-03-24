import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingUser extends Document {
  email: string;
  otp: string;
  otpExpires: Date;
  isEmailVerified: boolean;
  name: string;
  password?: string; // Hashed password
  companyName?: string;
  phone?: string;
  loginPin?: string;
  planId?: string;
  billingPeriod?: string;
  countryCode?: string;
  currency?: string; // ISO currency code e.g. 'USD', 'INR', 'EUR'
  /** USD total for this checkout (after early-bird rules), for receipts */
  amountUsd?: number;
  /** Razorpay order amount in smallest unit (paise, cents, etc.) */
  rzpAmountMinor?: number;
  /** Razorpay order currency (matches charge) */
  rzpCurrency?: string;
  razorpayOrderId?: string;
  createdAt: Date;
}

const PendingUserSchema = new Schema<IPendingUser>({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  isEmailVerified: { type: Boolean, default: false },
  name: { type: String, required: true },
  password: { type: String }, // optional because it's populated during signup preparation
  companyName: { type: String },
  phone: { type: String },
  loginPin: { type: String },
  planId: { type: String },
  billingPeriod: { type: String },
  countryCode: { type: String },
  currency: { type: String, default: 'USD' },
  amountUsd: { type: Number },
  rzpAmountMinor: { type: Number },
  rzpCurrency: { type: String },
  razorpayOrderId: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL index for 24 hours
}, {
  timestamps: true,
});

// Since email is not fully verified and we can have multiple attempts, we might not want to enforce unique: true on email. 
// However, to keep it simple and avoid spam, let's index email.
PendingUserSchema.index({ email: 1 });

if (mongoose.models.PendingUser) {
  delete mongoose.models.PendingUser;
}

export default mongoose.model<IPendingUser>('PendingUser', PendingUserSchema);
