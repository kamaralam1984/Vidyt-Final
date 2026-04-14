import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLog {
  email: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: Date;
}

export interface IBulkEmailCampaign extends Document {
  subject: string;
  body: string;
  recipients: string[];
  logs: IEmailLog[];
  status: 'draft' | 'sending' | 'done' | 'scheduled';
  scheduledAt?: Date;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    email: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    error: { type: String },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BulkEmailCampaignSchema = new Schema<IBulkEmailCampaign>(
  {
    subject: { type: String, required: true },
    body: { type: String, required: true },
    recipients: [{ type: String }],
    logs: [EmailLogSchema],
    status: { type: String, enum: ['draft', 'sending', 'done', 'scheduled'], default: 'draft' },
    scheduledAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BulkEmailCampaignSchema.index({ createdAt: -1 });
BulkEmailCampaignSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.models.BulkEmailCampaign ||
  mongoose.model<IBulkEmailCampaign>('BulkEmailCampaign', BulkEmailCampaignSchema);
