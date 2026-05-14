import mongoose, { Schema, model, models } from 'mongoose';

// One row per email address that has unsubscribed from marketing.
// Used by marketing/drip/bulk email senders to filter recipients before sending.

export interface IEmailSuppression {
  email: string;
  reason: 'user_unsubscribe' | 'bounce' | 'complaint' | 'admin';
  source?: string;
  unsubscribedAt: Date;
}

const EmailSuppressionSchema = new Schema<IEmailSuppression>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  reason: { type: String, enum: ['user_unsubscribe', 'bounce', 'complaint', 'admin'], default: 'user_unsubscribe' },
  source: { type: String },
  unsubscribedAt: { type: Date, default: Date.now },
});

export default (models.EmailSuppression as mongoose.Model<IEmailSuppression>) ||
  model<IEmailSuppression>('EmailSuppression', EmailSuppressionSchema);
