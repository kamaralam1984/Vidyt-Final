import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  loginTime: Date;
  logoutTime?: Date;
  durationSeconds?: number;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  distanceFromAdmin?: number; // km
  currentPage?: string;
  currentPageSince?: Date;
  lastSeen?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  loginTime: { type: Date, default: Date.now },
  logoutTime: { type: Date },
  durationSeconds: { type: Number },
  ipAddress: { type: String },
  userAgent: { type: String },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  distanceFromAdmin: { type: Number },
  currentPage: { type: String },
  currentPageSince: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

UserSessionSchema.index({ userId: 1, isActive: 1 });
UserSessionSchema.index({ lastSeen: -1 });

export default mongoose.models.UserSession || mongoose.model<IUserSession>('UserSession', UserSessionSchema);
