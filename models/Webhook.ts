import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhook extends Document {
  userId: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhook>({
  userId: { type: String, required: true, index: true },
  url: { type: String, required: true },
  events: [{ type: String }],
  secret: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Webhook || mongoose.model<IWebhook>('Webhook', WebhookSchema);
