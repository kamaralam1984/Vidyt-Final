import mongoose, { Schema, Document } from 'mongoose';

export interface IDeletionLog extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  requestedAt: Date;
  confirmedAt?: Date;
  deletionCompletedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  dataDeleted: {
    videosDeleted: boolean;
    analyticsDeleted: boolean;
    tokensRevoked: boolean;
    subscriptionAnonymized: boolean;
    settingsCleared: boolean;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const deletionLogSchema = new Schema<IDeletionLog>(
  {
    userId: { type: String, required: true, unique: false, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    deletionCompletedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String },
    reason: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    dataDeleted: {
      videosDeleted: { type: Boolean, default: false },
      analyticsDeleted: { type: Boolean, default: false },
      tokensRevoked: { type: Boolean, default: false },
      subscriptionAnonymized: { type: Boolean, default: false },
      settingsCleared: { type: Boolean, default: false },
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for finding deletion records by user
deletionLogSchema.index({ userId: 1, createdAt: -1 });
deletionLogSchema.index({ status: 1 });
deletionLogSchema.index({ deletionCompletedAt: 1 });

export default mongoose.models.DeletionLog ||
  mongoose.model<IDeletionLog>('DeletionLog', deletionLogSchema);
