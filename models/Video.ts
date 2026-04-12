import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  userId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'upload';
  youtubeId?: string;
  facebookId?: string;
  instagramShortcode?: string;
  duration: number;
  views?: number;
  hashtags: string[];
  uploadedAt: Date;
  analysisId?: mongoose.Types.ObjectId;
}

const VideoSchema = new Schema<IVideo>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
    platform: { type: String, enum: ['youtube', 'facebook', 'instagram', 'tiktok', 'upload'], default: 'upload', index: true },
  youtubeId: { type: String, index: true },
  facebookId: { type: String, index: true },
  instagramShortcode: { type: String, index: true },
  duration: { type: Number, required: true },
  views: { type: Number, default: 0 },
  hashtags: [{ type: String }],
  uploadedAt: { type: Date, default: Date.now },
  analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis' },
});

export default mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
