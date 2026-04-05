import mongoose, { Schema, Document } from 'mongoose';

export interface IPreview extends Document {
  workspaceId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'linkedin';
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'commented';
  shareToken: string;
  clientFeedback?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PreviewSchema = new Schema<IPreview>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  thumbnailUrl: { type: String },
  videoUrl: { type: String },
  platform: { 
    type: String, 
    enum: ['youtube', 'tiktok', 'instagram', 'facebook', 'linkedin'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'commented'], 
    default: 'draft' 
  },
  shareToken: { type: String, required: true, unique: true },
  clientFeedback: { type: String },
  scheduledAt: { type: Date },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PreviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Preview || mongoose.model<IPreview>('Preview', PreviewSchema);
