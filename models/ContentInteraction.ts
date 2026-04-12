import mongoose, { Schema, Document } from 'mongoose';

/**
 * ContentInteraction — tracks every user action on Ultra AI Engine output.
 * Used by the Adaptive Learning Engine to identify winning patterns.
 */
export interface IContentInteraction extends Document {
  userId: string;
  sessionId: string;            // one generation run
  topic: string;
  niche: string;
  platform: string;
  language: string;
  region: string;

  // What user interacted with
  interactionType: 'hook_copy' | 'hook_view' | 'title_copy' | 'keyword_copy' | 'hashtag_copy' | 'script_copy' | 'desc_copy' | 'thumbnail_view' | 'generate';

  // The actual content interacted with
  content: string;              // the hook/title/keyword text
  contentIndex: number;         // position in the list (0 = #1 slot)
  hookStyle?: string;           // e.g. Curiosity, Shock, Story

  // Performance feedback (filled later via /api/learn/feedback)
  performanceViews?: number;
  performanceCTR?: number;
  performanceRetention?: number;
  performanceEngagement?: number;
  viralLabel?: 0 | 1;           // 1 = went viral, 0 = did not

  createdAt: Date;
}

const ContentInteractionSchema = new Schema<IContentInteraction>({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  topic: { type: String, required: true },
  niche: { type: String, default: '' },
  platform: { type: String, required: true },
  language: { type: String, default: 'english' },
  region: { type: String, default: 'india' },
  interactionType: {
    type: String,
    enum: ['hook_copy', 'hook_view', 'title_copy', 'keyword_copy', 'hashtag_copy', 'script_copy', 'desc_copy', 'thumbnail_view', 'generate'],
    required: true,
  },
  content: { type: String, required: true },
  contentIndex: { type: Number, default: 0 },
  hookStyle: { type: String },
  performanceViews: { type: Number },
  performanceCTR: { type: Number },
  performanceRetention: { type: Number },
  performanceEngagement: { type: Number },
  viralLabel: { type: Number, enum: [0, 1] },
}, { timestamps: true });

// TTL: auto-delete raw interactions after 90 days (keep DB lean)
ContentInteractionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
ContentInteractionSchema.index({ userId: 1, interactionType: 1 });
ContentInteractionSchema.index({ topic: 1, platform: 1, interactionType: 1 });

export default mongoose.models.ContentInteraction ||
  mongoose.model<IContentInteraction>('ContentInteraction', ContentInteractionSchema);
