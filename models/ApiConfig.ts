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
  paypalClientId?: string;
  paypalClientSecret?: string;
  paypalWebhookId?: string;
  groqApiKey?: string;
  openrouterApiKey?: string;
  mistralApiKey?: string;
  cohereApiKey?: string;
  deepseekApiKey?: string;
  togetherApiKey?: string;
  huggingfaceApiKey?: string;
  serpapiKey?: string;
  rapidapiKey?: string;
  customApis?: Map<string, string>;
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
    paypalClientId: { type: String, default: '' },
    paypalClientSecret: { type: String, default: '' },
    paypalWebhookId: { type: String, default: '' },
    groqApiKey: { type: String, default: '' },
    openrouterApiKey: { type: String, default: '' },
    mistralApiKey: { type: String, default: '' },
    cohereApiKey: { type: String, default: '' },
    deepseekApiKey: { type: String, default: '' },
    togetherApiKey: { type: String, default: '' },
    huggingfaceApiKey: { type: String, default: '' },
    serpapiKey: { type: String, default: '' },
    rapidapiKey: { type: String, default: '' },
    customApis: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.ApiConfig || mongoose.model<IApiConfig>('ApiConfig', ApiConfigSchema);
