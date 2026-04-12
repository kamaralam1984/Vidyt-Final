export const dynamic = "force-dynamic";

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
    const c = (doc || {}) as Record<string, any>;
    const customApisObj = c.customApis || {};
    const maskedCustomApis: Record<string, string> = {};
    const statusCustomApis: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(customApisObj)) {
      if (typeof v === 'string') {
        maskedCustomApis[k] = (v && v.length > 0) ? mask(v) : '';
        statusCustomApis[k] = !!(v?.trim());
      }
    }
    return NextResponse.json({
      youtubeDataApiKey: (c.youtubeDataApiKey && c.youtubeDataApiKey.length > 0) ? mask(c.youtubeDataApiKey) : '',
      resendApiKey: (c.resendApiKey && c.resendApiKey.length > 0) ? mask(c.resendApiKey) : '',
      openaiApiKey: (c.openaiApiKey && c.openaiApiKey.length > 0) ? mask(c.openaiApiKey) : '',
      assemblyaiApiKey: (c.assemblyaiApiKey && c.assemblyaiApiKey.length > 0) ? mask(c.assemblyaiApiKey) : '',
      googleGeminiApiKey: (c.googleGeminiApiKey && c.googleGeminiApiKey.length > 0) ? mask(c.googleGeminiApiKey) : '',
      sentryDsn: (c.sentryDsn && c.sentryDsn.length > 0) ? mask(c.sentryDsn) : '',
      sentryServerDsn: (c.sentryServerDsn && c.sentryServerDsn.length > 0) ? mask(c.sentryServerDsn) : '',
      paypalClientId: (c.paypalClientId && c.paypalClientId.length > 0) ? mask(c.paypalClientId) : '',
      paypalClientSecret: (c.paypalClientSecret && c.paypalClientSecret.length > 0) ? mask(c.paypalClientSecret) : '',
      paypalWebhookId: (c.paypalWebhookId && c.paypalWebhookId.length > 0) ? mask(c.paypalWebhookId) : '',
      groqApiKey: (c.groqApiKey && c.groqApiKey.length > 0) ? mask(c.groqApiKey) : '',
      openrouterApiKey: (c.openrouterApiKey && c.openrouterApiKey.length > 0) ? mask(c.openrouterApiKey) : '',
      mistralApiKey: (c.mistralApiKey && c.mistralApiKey.length > 0) ? mask(c.mistralApiKey) : '',
      cohereApiKey: (c.cohereApiKey && c.cohereApiKey.length > 0) ? mask(c.cohereApiKey) : '',
      deepseekApiKey: (c.deepseekApiKey && c.deepseekApiKey.length > 0) ? mask(c.deepseekApiKey) : '',
      togetherApiKey: (c.togetherApiKey && c.togetherApiKey.length > 0) ? mask(c.togetherApiKey) : '',
      huggingfaceApiKey: (c.huggingfaceApiKey && c.huggingfaceApiKey.length > 0) ? mask(c.huggingfaceApiKey) : '',
      serpapiKey: (c.serpapiKey && c.serpapiKey.length > 0) ? mask(c.serpapiKey) : '',
      rapidapiKey: (c.rapidapiKey && c.rapidapiKey.length > 0) ? mask(c.rapidapiKey) : '',
      status: {
        youtube: !!(c.youtubeDataApiKey?.trim()),
        resend: !!(c.resendApiKey?.trim()),
        openai: !!(c.openaiApiKey?.trim()),
        assemblyai: !!(c.assemblyaiApiKey?.trim()),
        gemini: !!(c.googleGeminiApiKey?.trim()),
        sentry: !!(c.sentryDsn?.trim()),
        paypal: !!(c.paypalClientId?.trim()),
        groq: !!(c.groqApiKey?.trim()),
        openrouter: !!(c.openrouterApiKey?.trim()),
        mistral: !!(c.mistralApiKey?.trim()),
        cohere: !!(c.cohereApiKey?.trim()),
        deepseek: !!(c.deepseekApiKey?.trim()),
        together: !!(c.togetherApiKey?.trim()),
        huggingface: !!(c.huggingfaceApiKey?.trim()),
        serpapi: !!(c.serpapiKey?.trim()),
        rapidapi: !!(c.rapidapiKey?.trim()),
        customApis: statusCustomApis,
      },
      customApis: maskedCustomApis,
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
      'sentryDsn', 'sentryServerDsn', 'paypalClientId', 'paypalClientSecret', 'paypalWebhookId',
      'groqApiKey', 'openrouterApiKey', 'mistralApiKey', 'cohereApiKey', 'deepseekApiKey', 'togetherApiKey', 'huggingfaceApiKey', 'serpapiKey', 'rapidapiKey'
    ];
    const maskPlaceholder = '••••••••';
    for (const k of keys) {
      if (body[k] === undefined) continue;
      const val = typeof body[k] === 'string' ? body[k].trim() : '';
      if (val === maskPlaceholder || val === '********') continue;
      updates[k] = val;
    }
    
    if (body.customApis && typeof body.customApis === 'object') {
      for (const [k, v] of Object.entries(body.customApis)) {
        if (typeof v !== 'string') continue;
        const val = v.trim();
        if (val === maskPlaceholder || val === '********') continue;
        updates[`customApis.${k}`] = val;
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
