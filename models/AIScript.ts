import mongoose, { Schema, Document } from 'mongoose';

export interface IAIScript extends Document {
  userId: string;
  topic: string;
  platform: string;
  duration: string;
  language: string;
  hooks: string[];
  script: string;
  titles: string[];
  hashtags: string[];
  cta: string;
  createdAt: Date;
}

const AIScriptSchema = new Schema<IAIScript>({
  userId: { type: String, required: true, index: true },
  topic: { type: String, required: true },
  platform: { type: String, required: true },
  duration: { type: String, required: true },
  language: { type: String, required: true },
  hooks: [{ type: String }],
  script: { type: String, default: '' },
  titles: [{ type: String }],
  hashtags: [{ type: String }],
  cta: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.AIScript || mongoose.model<IAIScript>('AIScript', AIScriptSchema);
