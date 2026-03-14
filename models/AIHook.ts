import mongoose, { Schema, Document } from 'mongoose';

export interface IHookItem {
  hook: string;
  psychologyType: string;
  whyItWorks: string;
}

export interface IAIHook extends Document {
  userId: string;
  topic: string;
  niche: string;
  platform: string;
  hooks: IHookItem[];
  createdAt: Date;
}

const HookItemSchema = new Schema({
  hook: { type: String, required: true },
  psychologyType: { type: String, required: true },
  whyItWorks: { type: String, required: true },
}, { _id: false });

const AIHookSchema = new Schema<IAIHook>({
  userId: { type: String, required: true, index: true },
  topic: { type: String, required: true },
  niche: { type: String, default: '' },
  platform: { type: String, required: true },
  hooks: [HookItemSchema],
}, { timestamps: true });

export default mongoose.models.AIHook || mongoose.model<IAIHook>('AIHook', AIHookSchema);
