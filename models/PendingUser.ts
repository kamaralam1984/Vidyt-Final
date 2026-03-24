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
  currency?: string; // ISO currency code e.g. 'USD', 'INR', 'EUR'
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
  currency: { type: String, default: 'USD' }, // ISO currency code
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
