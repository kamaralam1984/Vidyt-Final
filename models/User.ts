import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uniqueId: string;
  googleId?: string;
  email: string;
  password: string;
  name: string;
  companyName?: string;
  phone?: string;
  loginPin?: string;
  role: 'user' | 'admin' | 'manager' | 'super-admin' | 'superadmin' | 'enterprise';
  subscription: 'free' | 'starter' | 'pro' | 'enterprise' | 'custom' | 'owner';
  subscriptionExpiresAt?: Date;
  subscriptionPlan?: {
    planId: string;
    planName: string;
    billingPeriod: 'month' | 'year';
    price: number;
    currency: string;
    status: 'active' | 'trial' | 'expired' | 'cancelled';
    startDate?: Date;
    endDate?: Date;
    paymentId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paypalSubscriptionId?: string;
    paypalOrderId?: string;
    earlyBirdDiscount?: boolean;
  };
  profilePicture?: string;
  bio?: string;
  socialLinks?: {
    youtube?: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    darkMode: boolean;
  };
  language?: 'en' | 'hi';
  lastUsageAlertSent?: Date;
  lastExpiryAlertSent?: Date;
  usageStats?: {
    videosAnalyzed: number;
    analysesThisMonth: number;
    competitorsTracked: number;
    hashtagsGenerated: number;
    requestsToday?: number;
    lastRequestDate?: Date;
  };
  customLimits?: Record<string, number>;
  lastLogin?: Date;
  accountManagerEmail?: string;
  webhookUrl?: string;
  whiteLabelCompanyName?: string;
  whiteLabelLogoUrl?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailOtp?: string;
  emailOtpExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  youtube?: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: Date;
  };
  deletionRequestCode?: string;
  deletionRequestExpiry?: Date;
  deletionRequestedAt?: Date;
  deletedAt?: Date;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  activeWorkspaceId?: mongoose.Types.ObjectId;
  workspaces?: mongoose.Types.ObjectId[];
  videos: mongoose.Types.ObjectId[];
  apiKey?: string;
  paypalCustomerId?: string;
  paypalSubscriptionId?: string;
}

const UserSchema = new Schema<IUser>({
  uniqueId: { type: String, required: false, unique: true, index: true },
  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  name: { type: String, required: false },
  companyName: { type: String },
  phone: { type: String },
  loginPin: { type: String },
  role: { type: String, enum: ['user', 'admin', 'manager', 'super-admin', 'superadmin', 'enterprise'], default: 'user' },
  subscription: { type: String, enum: ['free', 'starter', 'pro', 'enterprise', 'custom', 'owner'], default: 'free' },
  subscriptionExpiresAt: { type: Date },
  subscriptionPlan: {
    planId: { type: String },
    planName: { type: String },
    billingPeriod: { type: String, enum: ['month', 'year'] },
    price: { type: Number },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['active', 'trial', 'expired', 'cancelled'], default: 'trial' },
    startDate: { type: Date },
    endDate: { type: Date },
    paymentId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paypalSubscriptionId: { type: String },
    paypalOrderId: { type: String },
    earlyBirdDiscount: { type: Boolean, default: false },
  },
  profilePicture: { type: String },
  bio: { type: String },
  socialLinks: {
    youtube: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    tiktok: { type: String },
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
  },
  language: { type: String, enum: ['en', 'hi'], default: 'en' },
  lastUsageAlertSent: { type: Date },
  lastExpiryAlertSent: { type: Date },
  usageStats: {
    videosAnalyzed: { type: Number, default: 0 },
    analysesThisMonth: { type: Number, default: 0 },
    competitorsTracked: { type: Number, default: 0 },
    hashtagsGenerated: { type: Number, default: 0 },
    requestsToday: { type: Number, default: 0 },
    lastRequestDate: { type: Date },
  },
  customLimits: { type: Map, of: Number, default: {} },
  lastLogin: { type: Date },
  accountManagerEmail: { type: String },
  webhookUrl: { type: String },
  whiteLabelCompanyName: { type: String },
  whiteLabelLogoUrl: { type: String },
  emailVerified: { type: Boolean, default: false, index: true },
  emailVerificationToken: { type: String },
  emailOtp: { type: String },
  emailOtpExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  onboardingCompleted: { type: Boolean, default: false, index: true },
  onboardingStep: { type: Number, default: 0 },
  youtube: {
    access_token: { type: String },
    refresh_token: { type: String },
    expiry_date: { type: Date }
  },
  deletionRequestCode: { type: String },
  deletionRequestExpiry: { type: Date },
  deletionRequestedAt: { type: Date },
  deletedAt: { type: Date },
  isDeleted: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  videos: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  activeWorkspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }],
  apiKey: { type: String, unique: true, sparse: true, index: true },
  paypalCustomerId: { type: String, unique: true, sparse: true },
  paypalSubscriptionId: { type: String, unique: true, sparse: true },
}, {
  timestamps: true,
});

// Indexes (uniqueId and email already indexed via index: true / unique: true)
UserSchema.index({ subscription: 1 });
UserSchema.index({ role: 1 });

// In dev, Next.js can hot-reload this file multiple times.
// To ensure schema updates apply, reset existing model before re-registering.
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', UserSchema);
