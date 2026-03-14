import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true },
  keyPrefix: { type: String, required: true },
  lastUsedAt: { type: Date },
}, { timestamps: true });

export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const key = 'vb_' + crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.slice(0, 12) + '...';
  return { key, keyHash, keyPrefix };
}

export default mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
