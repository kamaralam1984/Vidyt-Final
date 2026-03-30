import mongoose, { Document, Schema } from 'mongoose';

export interface IAbuseLog extends Document {
  // Identifiers
  ipAddress: string;
  userId?: string;
  userAgent?: string;

  // Request information
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusCode?: number;

  // Violation details
  violationType: 'rate_limit_exceeded' | 'bot_detected' | 'suspicious_activity' | 'blocked_ip' | 'excessive_failures';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;

  // Bot detection data
  botScore?: number;
  botReasons?: string[];
  suspiciousPatterns?: string[];

  // Tracking
  attemptCount?: number;
  failureCount?: number;
  lastAttemptAt?: Date;

  // Admin notes
  reviewed?: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  adminNotes?: string;
  actionTaken?: 'none' | 'warning' | 'rate_limit_increased' | 'ip_blocked' | 'account_suspended';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const AbuseLogSchema = new Schema<IAbuseLog>(
  {
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    userAgent: String,

    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      required: true,
    },
    statusCode: Number,

    violationType: {
      type: String,
      enum: [
        'rate_limit_exceeded',
        'bot_detected',
        'suspicious_activity',
        'blocked_ip',
        'excessive_failures',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },

    botScore: Number,
    botReasons: [String],
    suspiciousPatterns: [String],

    attemptCount: { type: Number, default: 1 },
    failureCount: { type: Number, default: 0 },
    lastAttemptAt: Date,

    reviewed: { type: Boolean, default: false, index: true },
    reviewedBy: String,
    reviewedAt: Date,
    adminNotes: String,
    actionTaken: {
      type: String,
      enum: [
        'none',
        'warning',
        'rate_limit_increased',
        'ip_blocked',
        'account_suspended',
      ],
      default: 'none',
    },
  },
  {
    timestamps: true,
    collection: 'abuselogs',
  }
);

// Indexes for queries
AbuseLogSchema.index({ createdAt: -1 });
AbuseLogSchema.index({ ipAddress: 1, createdAt: -1 });
AbuseLogSchema.index({ userId: 1, createdAt: -1 });
AbuseLogSchema.index({ severity: 1, reviewed: 1 });
AbuseLogSchema.index({ violationType: 1, createdAt: -1 });

// Method to check if user/IP is currently flagged as high-risk
AbuseLogSchema.statics.isHighRisk = async function (
  ipAddress: string,
  userId?: string
) {
  const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

  const criticalAbuses = await this.countDocuments({
    $or: [{ ipAddress }, ...(userId ? [{ userId }] : [])],
    severity: { $in: ['high', 'critical'] },
    createdAt: { $gt: recentThreshold },
  });

  return criticalAbuses > 0;
};

// Method to log abuse manually
AbuseLogSchema.statics.logAbuse = async function (data: Partial<IAbuseLog>) {
  try {
    const log = new this({
      ...data,
      createdAt: new Date(),
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging abuse:', error);
    throw error;
  }
};

// Method to get recent abuse summary
AbuseLogSchema.statics.getRecentSummary = async function (hours: number = 24) {
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);

  return await this.aggregate([
    { $match: { createdAt: { $gt: threshold } } },
    {
      $group: {
        _id: '$violationType',
        count: { $sum: 1 },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export const AbuseLog =
  mongoose.models.AbuseLog || mongoose.model<IAbuseLog>('AbuseLog', AbuseLogSchema);
