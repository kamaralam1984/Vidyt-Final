import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'warning' | 'limit_reached';
  message: string;
  feature?: string;
  threshold?: number;
  dayKey?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['warning', 'limit_reached'], required: true },
  message: { type: String, required: true },
  feature: { type: String, index: true },
  threshold: { type: Number },
  dayKey: { type: String, index: true },
  read: { type: Boolean, default: false },
}, {
  timestamps: true,
});

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model<INotification>('Notification', NotificationSchema);
