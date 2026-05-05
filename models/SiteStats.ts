import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteStats extends Document {
  key: string;
  downloads: number;
  pageViews: number;
  updatedAt: Date;
}

const SiteStatsSchema = new Schema<ISiteStats>({
  key: { type: String, default: 'global', unique: true },
  downloads: { type: Number, default: 0 },
  pageViews: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.SiteStats ||
  mongoose.model<ISiteStats>('SiteStats', SiteStatsSchema);
