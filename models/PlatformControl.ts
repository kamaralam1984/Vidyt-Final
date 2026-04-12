import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformControl extends Document {
    platform: 'youtube' | 'facebook' | 'instagram' | 'support' | string;
    isEnabled: boolean;
    allowedPlans: string[];
    features: Map<string, boolean>;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PlatformControlSchema = new Schema<IPlatformControl>({
    platform: { type: String, required: true, unique: true },
    isEnabled: { type: Boolean, default: true },
    allowedPlans: { type: [String], default: ['free', 'pro', 'enterprise'] },
    features: { type: Map, of: Boolean, default: new Map() },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true
});

if (mongoose.models.PlatformControl) {
    delete mongoose.models.PlatformControl;
}

export default mongoose.model<IPlatformControl>('PlatformControl', PlatformControlSchema);
