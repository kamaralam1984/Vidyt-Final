import mongoose from 'mongoose';

const SeoPageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  keyword: { type: String, required: true, index: true },
  title: { type: String, required: true },
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  content: { type: String, default: '' },
  hashtags: [String],
  relatedKeywords: [String],
  viralScore: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  source: { type: String, enum: ['user_search', 'auto_daily', 'trending'], default: 'user_search' },
  views: { type: Number, default: 0 },
}, { timestamps: true });

SeoPageSchema.index({ createdAt: -1 });
SeoPageSchema.index({ views: -1 });
SeoPageSchema.index({ viralScore: -1 });

export default mongoose.models.SeoPage || mongoose.model('SeoPage', SeoPageSchema);
