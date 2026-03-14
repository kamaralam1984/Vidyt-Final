import { NextRequest } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import User from '@/models/User';

export async function getUserFromApiKey(request: NextRequest): Promise<{ id: string; email?: string; subscription?: string } | null> {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!apiKey || !apiKey.startsWith('vb_')) return null;
  try {
    await connectDB();
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyDoc = (await ApiKey.findOne({ keyHash }).lean()) as { _id: unknown; userId: string } | null;
    if (!keyDoc) return null;
    await ApiKey.updateOne({ _id: keyDoc._id }, { lastUsedAt: new Date() });
    const user = (await User.findById(keyDoc.userId).select('email subscription').lean()) as { email?: string; subscription?: string } | null;
    if (!user) return null;
    return { id: keyDoc.userId, email: user.email, subscription: user.subscription };
  } catch {
    return null;
  }
}
