import mongoose, { Schema, Document } from 'mongoose';

export interface IFoundEmail extends Document {
  email: string;
  name: string;
  platform: 'youtube' | 'google_business' | 'facebook' | 'instagram';
  profileUrl?: string;
  followers?: number | null;
  website?: string | null;
  address?: string | null;
  phone?: string | null;
  rating?: number | null;
  category?: string | null;
  country?: string | null;
  keyword: string;
  savedAt: Date;
}

const FoundEmailSchema = new Schema<IFoundEmail>(
  {
    email: { type: String, required: true },
    name: { type: String, default: '' },
    platform: { type: String, enum: ['youtube', 'google_business', 'facebook', 'instagram'], required: true },
    profileUrl: { type: String },
    followers: { type: Number, default: null },
    website: { type: String, default: null },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    rating: { type: Number, default: null },
    category: { type: String, default: null },
    country: { type: String, default: null },
    keyword: { type: String, default: '' },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

FoundEmailSchema.index({ email: 1 }, { unique: true });
FoundEmailSchema.index({ platform: 1 });
FoundEmailSchema.index({ savedAt: -1 });
FoundEmailSchema.index({ keyword: 1 });

export default mongoose.models.FoundEmail ||
  mongoose.model<IFoundEmail>('FoundEmail', FoundEmailSchema);
