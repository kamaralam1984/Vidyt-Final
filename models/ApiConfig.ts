import mongoose, { Schema, Document } from 'mongoose';

export interface IApiConfig extends Document {
  id: string;
  youtubeDataApiKey?: string;
  resendApiKey?: string;
  openaiApiKey?: string;
  assemblyaiApiKey?: string;
  googleGeminiApiKey?: string;
  sentryDsn?: string;
  sentryServerDsn?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripePublishableKey?: string;
  updatedAt: Date;
}

const ApiConfigSchema = new Schema<IApiConfig>(
  {
    id: { type: String, required: true, unique: true, default: 'default' },
    youtubeDataApiKey: { type: String, default: '' },
    resendApiKey: { type: String, default: '' },
    openaiApiKey: { type: String, default: '' },
    assemblyaiApiKey: { type: String, default: '' },
    googleGeminiApiKey: { type: String, default: '' },
    sentryDsn: { type: String, default: '' },
    sentryServerDsn: { type: String, default: '' },
    stripeSecretKey: { type: String, default: '' },
    stripeWebhookSecret: { type: String, default: '' },
    stripePublishableKey: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.ApiConfig || mongoose.model<IApiConfig>('ApiConfig', ApiConfigSchema);
