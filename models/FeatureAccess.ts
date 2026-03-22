import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureAccess extends Document {
  feature: string;
  label: string;
  group: 'sidebar' | 'dashboard' | 'other';
  allowedRoles: string[];
  enabled: boolean;
  updatedAt: Date;
}

const FeatureAccessSchema = new Schema<IFeatureAccess>({
  feature: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  group: { type: String, enum: ['sidebar', 'dashboard', 'other'], default: 'other' },
  allowedRoles: [{ type: String }],
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.FeatureAccess || mongoose.model<IFeatureAccess>('FeatureAccess', FeatureAccessSchema);
