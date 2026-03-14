import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ApiConfig from '@/models/ApiConfig';
import { clearApiConfigCache } from '@/lib/apiConfig';

function mask(key: string | undefined): string {
  if (!key || key.trim() === '') return '';
  return '••••••••';
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const doc = await ApiConfig.findOne({ id: 'default' }).lean();
    const c = (doc || {}) as Record<string, string | undefined>;
    return NextResponse.json({
      youtubeDataApiKey: (c.youtubeDataApiKey && c.youtubeDataApiKey.length > 0) ? mask(c.youtubeDataApiKey) : '',
      resendApiKey: (c.resendApiKey && c.resendApiKey.length > 0) ? mask(c.resendApiKey) : '',
      openaiApiKey: (c.openaiApiKey && c.openaiApiKey.length > 0) ? mask(c.openaiApiKey) : '',
      assemblyaiApiKey: (c.assemblyaiApiKey && c.assemblyaiApiKey.length > 0) ? mask(c.assemblyaiApiKey) : '',
      googleGeminiApiKey: (c.googleGeminiApiKey && c.googleGeminiApiKey.length > 0) ? mask(c.googleGeminiApiKey) : '',
      sentryDsn: (c.sentryDsn && c.sentryDsn.length > 0) ? mask(c.sentryDsn) : '',
      sentryServerDsn: (c.sentryServerDsn && c.sentryServerDsn.length > 0) ? mask(c.sentryServerDsn) : '',
      stripeSecretKey: (c.stripeSecretKey && c.stripeSecretKey.length > 0) ? mask(c.stripeSecretKey) : '',
      stripeWebhookSecret: (c.stripeWebhookSecret && c.stripeWebhookSecret.length > 0) ? mask(c.stripeWebhookSecret) : '',
      stripePublishableKey: (c.stripePublishableKey && c.stripePublishableKey.length > 0) ? mask(c.stripePublishableKey) : '',
      status: {
        youtube: !!(c.youtubeDataApiKey?.trim()),
        resend: !!(c.resendApiKey?.trim()),
        openai: !!(c.openaiApiKey?.trim()),
        assemblyai: !!(c.assemblyaiApiKey?.trim()),
        gemini: !!(c.googleGeminiApiKey?.trim()),
        sentry: !!(c.sentryDsn?.trim()),
        stripe: !!(c.stripeSecretKey?.trim()),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const updates: Record<string, string> = {};
    const keys = [
      'youtubeDataApiKey', 'resendApiKey', 'openaiApiKey', 'assemblyaiApiKey', 'googleGeminiApiKey',
      'sentryDsn', 'sentryServerDsn', 'stripeSecretKey', 'stripeWebhookSecret', 'stripePublishableKey',
    ];
    for (const k of keys) {
      if (body[k] !== undefined) {
        updates[k] = typeof body[k] === 'string' ? body[k].trim() : '';
      }
    }
    await connectDB();
    await ApiConfig.findOneAndUpdate(
      { id: 'default' },
      { $set: updates, id: 'default' },
      { upsert: true, new: true }
    );
    clearApiConfigCache();
    return NextResponse.json({ success: true, message: 'API config saved.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
