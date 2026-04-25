import mongoose from 'mongoose';

const AuditAlertSchema = new mongoose.Schema({
  siteUrl: { type: String, required: true, index: true },
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteAudit' },
  type: {
    type: String,
    enum: ['downtime', 'performance_drop', 'security_issue', 'seo_issue', 'score_critical', 'server_high_load'],
    required: true,
  },
  severity: { type: String, enum: ['info', 'warning', 'critical'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  details: mongoose.Schema.Types.Mixed,
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  emailSent: { type: Boolean, default: false },
  emailSentAt: Date,
}, { timestamps: true });

AuditAlertSchema.index({ acknowledged: 1 });
AuditAlertSchema.index({ severity: 1 });
AuditAlertSchema.index({ createdAt: -1 });
AuditAlertSchema.index({ siteUrl: 1, createdAt: -1 });

export default mongoose.models.AuditAlert || mongoose.model('AuditAlert', AuditAlertSchema);
