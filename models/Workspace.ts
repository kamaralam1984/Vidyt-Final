import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  description?: string;
  logoUrl?: string;
  settings: {
    brandColors?: {
      primary: string;
      secondary: string;
    };
    reportBranding?: boolean;
    autoApproveClientPreviews?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  logoUrl: { type: String },
  settings: {
    brandColors: {
      primary: { type: String, default: '#FF0000' },
      secondary: { type: String, default: '#0F0F0F' },
    },
    reportBranding: { type: Number, default: false },
    autoApproveClientPreviews: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
WorkspaceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
