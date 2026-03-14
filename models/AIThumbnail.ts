import mongoose, { Schema, Document } from 'mongoose';

export interface IAIThumbnail extends Document {
  userId: string;
  videoTitle: string;
  topic: string;
  emotion: string;
  niche: string;
  textSuggestions: string[];
  layoutIdea: string;
  colorPalette: string[];
  ctrScore: number;
  createdAt: Date;
}

const AIThumbnailSchema = new Schema<IAIThumbnail>({
  userId: { type: String, required: true, index: true },
  videoTitle: { type: String, required: true },
  topic: { type: String, default: '' },
  emotion: { type: String, default: '' },
  niche: { type: String, default: '' },
  textSuggestions: [{ type: String }],
  layoutIdea: { type: String, default: '' },
  colorPalette: [{ type: String }],
  ctrScore: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.AIThumbnail || mongoose.model<IAIThumbnail>('AIThumbnail', AIThumbnailSchema);
