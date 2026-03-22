import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketReply extends Document {
  ticketId: mongoose.Types.ObjectId;
  sender: 'user' | 'ai' | 'admin';
  message: string;
  isInternal?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketReplySchema = new Schema<ITicketReply>({
  ticketId: { type: Schema.Types.ObjectId, required: true, ref: 'Ticket', index: true },
  sender: { type: String, enum: ['user', 'ai', 'admin'], required: true },
  message: { type: String, required: true },
  isInternal: { type: Boolean, default: false }
}, { timestamps: true });

if (mongoose.models.TicketReply) {
    delete mongoose.models.TicketReply;
}

export default mongoose.model<ITicketReply>('TicketReply', TicketReplySchema);
