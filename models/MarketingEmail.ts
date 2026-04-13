import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketingEmail extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  emailType: 'welcome' | 'feature_drip_1' | 'feature_drip_2' | 'feature_drip_3' | 'feature_drip_4' | 'feature_drip_5' | 'upgrade_nudge' | 'upgrade_premium';
  sentAt: Date;
  opened: boolean;
  openedAt?: Date;
  clicked: boolean;
  clickedAt?: Date;
  status: 'sent' | 'failed' | 'bounced';
  createdAt: Date;
  updatedAt: Date;
}

const MarketingEmailSchema = new Schema<IMarketingEmail>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true },
    emailType: {
      type: String,
      required: true,
      enum: [
        'welcome',
        'feature_drip_1',
        'feature_drip_2',
        'feature_drip_3',
        'feature_drip_4',
        'feature_drip_5',
        'upgrade_nudge',
        'upgrade_premium',
      ],
    },
    sentAt: { type: Date, default: Date.now },
    opened: { type: Boolean, default: false },
    openedAt: { type: Date },
    clicked: { type: Boolean, default: false },
    clickedAt: { type: Date },
    status: { type: String, enum: ['sent', 'failed', 'bounced'], default: 'sent' },
  },
  { timestamps: true }
);

// Compound index: prevent duplicate emails of same type to same user
MarketingEmailSchema.index({ userId: 1, emailType: 1 }, { unique: true });
MarketingEmailSchema.index({ sentAt: -1 });

export default mongoose.models.MarketingEmail ||
  mongoose.model<IMarketingEmail>('MarketingEmail', MarketingEmailSchema);
