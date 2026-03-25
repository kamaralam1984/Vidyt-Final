import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  category?: 'billing' | 'technical_issue' | 'account' | 'feature_request' | 'other';
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  aiAutoReplied?: boolean;
  aiConfidence?: number;
  assignedToAdmin?: boolean;
  aiLastReplyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, enum: ['billing', 'technical_issue', 'account', 'feature_request', 'other'], default: 'other', index: true },
  status: { type: String, enum: ['open', 'resolved', 'closed'], default: 'open', index: true },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal', index: true },
  aiAutoReplied: { type: Boolean, default: false, index: true },
  aiConfidence: { type: Number, default: 0 },
  assignedToAdmin: { type: Boolean, default: false, index: true },
  aiLastReplyAt: { type: Date },
}, { timestamps: true });

if (mongoose.models.Ticket) {
    delete mongoose.models.Ticket;
}

export default mongoose.model<ITicket>('Ticket', TicketSchema);
