import mongoose, { Schema, Document } from 'mongoose';

export interface IShortClip {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  caption: string;
  hookText: string;
  hashtags: string[];
  previewUrl?: string;
}

export interface IAIShorts extends Document {
  userId: string;
  originalVideoUrl?: string;
  originalTitle?: string;
  clips: IShortClip[];
  createdAt: Date;
}

const ShortClipSchema = new Schema({
  id: { type: String, required: true },
  startTime: { type: Number, default: 0 },
  endTime: { type: Number, default: 0 },
  title: { type: String, default: '' },
  caption: { type: String, default: '' },
  hookText: { type: String, default: '' },
  hashtags: [{ type: String }],
  previewUrl: { type: String },
}, { _id: false });

const AIShortsSchema = new Schema<IAIShorts>({
  userId: { type: String, required: true, index: true },
  originalVideoUrl: { type: String },
  originalTitle: { type: String },
  clips: [ShortClipSchema],
}, { timestamps: true });

export default mongoose.models.AIShorts || mongoose.model<IAIShorts>('AIShorts', AIShortsSchema);
