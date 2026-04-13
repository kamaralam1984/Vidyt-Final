import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedChannelAnalytics } from '@/services/youtube/advancedChannelAnalytics';
import { routeAI } from '@/lib/ai-router';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, channelId, url, question, context } = body;

    if (action === 'recommend') {
      const identifier = channelId || url || (context as any)?.url;
      if (!identifier) {
        return NextResponse.json({ error: 'Channel ID or URL is required' }, { status: 400 });
      }

      console.log('Fetching analytics for:', identifier);
      const analytics = await getAdvancedChannelAnalytics(identifier);

      const systemPrompt = `You are an expert YouTube channel auditor. Analyze the following channel data and provide 5-7 HIGHLY ACTIONABLE recommendations for growth. Focus on SEO, Thumbnails, Content Strategy, and Audience Retention.
      Return ONLY a JSON object with a 'recommendations' key containing an array of objects with 'title' and 'description' keys.
      Channel Data: ${JSON.stringify(analytics)}`;

      const userPrompt = `Audit the channel "${analytics.channelInfo.title}" (ID: ${analytics.channelInfo.id})`;

      let recommendations = [];

      try {
        const aiResponse = await routeAI({
          prompt: userPrompt,
          systemPrompt,
          cacheKey: `audit-recommend:${identifier}`,
          cacheTtlSec: 600,
        });
        const match = aiResponse.text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          recommendations = parsed.recommendations || [];
        }
      } catch (aiError: any) {
        console.error('AI route failed for audit recommend:', aiError.message);
      }

      return NextResponse.json({ recommendations, analytics });
    }

    if (action === 'ask') {
      if (!question) {
        return NextResponse.json({ error: 'Question is required' }, { status: 400 });
      }

      const contextStr = JSON.stringify(context || {}, null, 2);
      const systemPrompt = `You are an expert YouTube channel growth strategist. Use the following channel audit data to inform your answer. Reply in the language of the user.

      Channel audit data context:
      ${contextStr}`;

      try {
        const aiResponse = await routeAI({
          prompt: question,
          systemPrompt,
        });
        return NextResponse.json({ answer: aiResponse.text });
      } catch (aiError: any) {
        console.error('AI route failed for audit ask:', aiError.message);
        return NextResponse.json({ error: 'All AI providers are currently unavailable. Please try again later.' }, { status: 503 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('Admin Audit Error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
