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

  // ── Quality gate fields ───────────────────────────────────────────────────
  // Content size — used by qualityScorer. Google penalises thin pages, so we
  // refuse to sitemap anything below a word-count threshold.
  wordCount: { type: Number, default: 0 },
  // 0–100. Computed by lib/qualityScorer at create/update time.
  qualityScore: { type: Number, default: 0 },
  // Rank among trending topics on the day the page was generated (1 = hottest).
  // 0 = not from a trending source. Used as a freshness signal in scoring.
  trendingRank: { type: Number, default: 0 },
  // Master sitemap/indexability switch. Only `true` pages appear in sitemap.xml
  // and render without `robots: noindex`. The promote-seo-pages cron flips
  // this to true for the top-100 pages per day.
  isIndexable: { type: Boolean, default: false, index: true },
  // Timestamp of promotion to isIndexable. Drives sitemap sort order and
  // `publishedAt → lastModified` for Google freshness signals.
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

SeoPageSchema.index({ createdAt: -1 });
SeoPageSchema.index({ views: -1 });
SeoPageSchema.index({ viralScore: -1 });
SeoPageSchema.index({ qualityScore: -1 });
SeoPageSchema.index({ isIndexable: 1, publishedAt: -1 });
SeoPageSchema.index({ isIndexable: 1, qualityScore: -1 });

export default mongoose.models.SeoPage || mongoose.model('SeoPage', SeoPageSchema);
