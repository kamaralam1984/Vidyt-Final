import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
    userId: string;
    channelId: string;
    channelTitle: string;
    channelThumbnail?: string;
    accessToken: string;
    refreshToken: string;
    // Statistics
    subscribers: number;
    totalViews: number;
    videoCount: number;
    workspaceId?: mongoose.Types.ObjectId;
    lastSyncedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>({
    userId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, unique: true },
    channelTitle: { type: String, required: true },
    channelThumbnail: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    subscribers: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    lastSyncedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Create compound index so one user can quickly query their channels
ChannelSchema.index({ userId: 1, channelId: 1 });

if (mongoose.models.Channel) {
    delete mongoose.models.Channel;
}

export default mongoose.model<IChannel>('Channel', ChannelSchema);
