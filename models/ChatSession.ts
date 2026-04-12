import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  channel: 'support';
  status: 'active' | 'closed';
  title?: string;
  lastMessageAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    channel: { type: String, enum: ['support'], default: 'support', index: true },
    status: { type: String, enum: ['active', 'closed'], default: 'active', index: true },
    title: { type: String },
    lastMessageAt: { type: Date, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ChatSessionSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export default mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
