import mongoose, { Schema, Document } from 'mongoose';

export interface IControlLog extends Document {
    action: string;
    platform: string;
    changes: string; // JSON string of changes
    adminId: mongoose.Types.ObjectId; // ID of the super-admin who made the change
    adminEmail?: string;
    createdAt: Date;
}

const ControlLogSchema = new Schema<IControlLog>({
    action: { type: String, required: true },
    platform: { type: String, required: true },
    changes: { type: String, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminEmail: { type: String },
    createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.ControlLog) {
    delete mongoose.models.ControlLog;
}

export default mongoose.model<IControlLog>('ControlLog', ControlLogSchema);
