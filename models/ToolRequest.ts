import mongoose, { Schema, Document } from 'mongoose';

export interface IToolRequest extends Document {
  user: mongoose.Types.ObjectId;
  toolType: 'title-generator' | 'description-generator' | 'hashtag-generator';
  inputData: any;
  generatedOutput: any;
  status: 'pending' | 'completed' | 'failed';
  tokensUsed: number;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ToolRequestSchema = new Schema<IToolRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toolType: { 
      type: String, 
      enum: ['title-generator', 'description-generator', 'hashtag-generator'],
      required: true,
      index: true
    },
    inputData: { type: Schema.Types.Mixed, required: true },
    generatedOutput: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    tokensUsed: { type: Number, default: 0 },
    ipAddress: { type: String }
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics and rate limiting querying
ToolRequestSchema.index({ user: 1, toolType: 1, createdAt: -1 });

if (mongoose.models.ToolRequest) {
  delete mongoose.models.ToolRequest;
}

export default mongoose.model<IToolRequest>('ToolRequest', ToolRequestSchema);
