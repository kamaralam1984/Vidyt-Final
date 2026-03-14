import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureAccess extends Document {
  feature: string;
  allowedRoles: string[];
  updatedAt: Date;
}

const FeatureAccessSchema = new Schema<IFeatureAccess>({
  feature: { type: String, required: true, unique: true },
  allowedRoles: [{ type: String }],
}, { timestamps: true });

export default mongoose.models.FeatureAccess || mongoose.model<IFeatureAccess>('FeatureAccess', FeatureAccessSchema);
