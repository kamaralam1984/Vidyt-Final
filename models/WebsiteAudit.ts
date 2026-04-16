import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
  category: { type: String, enum: ['performance', 'seo', 'security', 'server'], required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], required: true },
  title: { type: String, required: true },
  description: String,
  fix: String,
}, { _id: false });

const PerformanceSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },        // 0-100
  responseTime: { type: Number, default: 0 }, // ms
  ttfb: { type: Number, default: 0 },         // ms
  fcp: { type: Number, default: 0 },          // ms
  lcp: { type: Number, default: 0 },          // ms
  cls: { type: Number, default: 0 },          // score
  tbt: { type: Number, default: 0 },          // ms
  pageSize: { type: Number, default: 0 },     // bytes
  requestCount: { type: Number, default: 0 },
  pagespeedData: mongoose.Schema.Types.Mixed, // raw PageSpeed API response
}, { _id: false });

const SeoSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  hasTitle: { type: Boolean, default: false },
  titleLength: { type: Number, default: 0 },
  titleText: String,
  hasMetaDescription: { type: Boolean, default: false },
  metaDescriptionLength: { type: Number, default: 0 },
  h1Count: { type: Number, default: 0 },
  hasCanonical: { type: Boolean, default: false },
  hasOgTags: { type: Boolean, default: false },
  hasTwitterCard: { type: Boolean, default: false },
  robotsTxt: { type: Boolean, default: false },
  sitemapXml: { type: Boolean, default: false },
  isHttps: { type: Boolean, default: false },
  hasStructuredData: { type: Boolean, default: false },
  internalLinksCount: { type: Number, default: 0 },
  imagesWithoutAlt: { type: Number, default: 0 },
}, { _id: false });

const SecuritySchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  isHttps: { type: Boolean, default: false },
  hasHSTS: { type: Boolean, default: false },
  hasCSP: { type: Boolean, default: false },
  hasXFrame: { type: Boolean, default: false },
  hasXContentType: { type: Boolean, default: false },
  hasXXssProtection: { type: Boolean, default: false },
  hasReferrerPolicy: { type: Boolean, default: false },
  hasPermissionsPolicy: { type: Boolean, default: false },
  serverHeader: String,
  poweredByHeader: String, // X-Powered-By exposure is a risk
  cookieFlags: { type: Boolean, default: false },
}, { _id: false });

const ServerMetricsSchema = new mongoose.Schema({
  cpuUsage: { type: Number, default: 0 },    // percentage
  memoryUsed: { type: Number, default: 0 },  // MB
  memoryTotal: { type: Number, default: 0 }, // MB
  memoryPercent: { type: Number, default: 0 },
  diskUsed: { type: Number, default: 0 },    // GB
  diskTotal: { type: Number, default: 0 },   // GB
  diskPercent: { type: Number, default: 0 },
  uptime: { type: Number, default: 0 },      // seconds
  loadAvg: [Number],
  nodeVersion: String,
  platform: String,
}, { _id: false });

const WebsiteAuditSchema = new mongoose.Schema({
  url: { type: String, required: true, index: true },
  type: { type: String, enum: ['scheduled', 'manual', 'cron'], default: 'manual' },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  overallScore: { type: Number, default: 0 },
  performance: { type: PerformanceSchema, default: () => ({}) },
  seo: { type: SeoSchema, default: () => ({}) },
  security: { type: SecuritySchema, default: () => ({}) },
  server: { type: ServerMetricsSchema, default: () => ({}) },
  issues: [IssueSchema],
  previousScore: Number, // for trend comparison
  scoreDelta: Number,    // positive = improved
  triggeredBy: String,
  errorMessage: String,
  duration: Number, // ms taken for audit
}, { timestamps: true });

WebsiteAuditSchema.index({ url: 1, createdAt: -1 });
WebsiteAuditSchema.index({ status: 1 });
WebsiteAuditSchema.index({ createdAt: -1 });

export default mongoose.models.WebsiteAudit || mongoose.model('WebsiteAudit', WebsiteAuditSchema);
