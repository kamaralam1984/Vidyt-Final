import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  userId: string;
  subject: string;
  message: string;
  priority: 'normal' | 'high' | 'priority'; // priority = 24/7 for enterprise
  status: 'open' | 'replied' | 'closed';
  reply?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
  userId: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'high', 'priority'], default: 'normal' },
  status: { type: String, enum: ['open', 'replied', 'closed'], default: 'open' },
  reply: { type: String },
  repliedAt: { type: Date },
}, { timestamps: true });

SupportTicketSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
