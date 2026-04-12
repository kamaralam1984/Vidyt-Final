import mongoose, { Schema, Document } from 'mongoose';

export interface ITrackingPageStatsDaily extends Document {
  page: string;
  day: string; // YYYY-MM-DD (UTC)
  visits: number;
}

const TrackingPageStatsDailySchema = new Schema<ITrackingPageStatsDaily>({
  page: { type: String, required: true },
  day: { type: String, required: true, index: true },
  visits: { type: Number, default: 0 },
}, { timestamps: true });

TrackingPageStatsDailySchema.index({ page: 1, day: 1 }, { unique: true });

export default mongoose.models.TrackingPageStatsDaily ||
  mongoose.model<ITrackingPageStatsDaily>('TrackingPageStatsDaily', TrackingPageStatsDailySchema);

