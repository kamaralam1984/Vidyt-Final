import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved', 'closed'], default: 'open', index: true },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal', index: true },
}, { timestamps: true });

if (mongoose.models.Ticket) {
    delete mongoose.models.Ticket;
}

export default mongoose.model<ITicket>('Ticket', TicketSchema);
