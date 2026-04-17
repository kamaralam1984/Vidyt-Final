import mongoose from 'mongoose';

const MonitoredSiteSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: String,
  isActive: { type: Boolean, default: true },
  isOwned: { type: Boolean, default: false }, // true = this is vidyt.com itself
  checkInterval: { type: String, enum: ['daily', 'weekly', 'manual'], default: 'daily' },
  alertThreshold: { type: Number, default: 60 }, // alert if score drops below this
  lastAuditAt: Date,
  lastAuditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteAudit' },
  lastScore: Number,
  avgScore7d: Number,
  addedBy: String,
  tags: [String],
}, { timestamps: true });

MonitoredSiteSchema.index({ isActive: 1 });
MonitoredSiteSchema.index({ url: 1 }, { unique: true });

export default mongoose.models.MonitoredSite || mongoose.model('MonitoredSite', MonitoredSiteSchema);
