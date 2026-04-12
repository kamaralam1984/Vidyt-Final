import { NextRequest, NextResponse } from 'next/server';
import { getApiConfig } from '@/lib/apiConfig';
import { getAdvancedChannelAnalytics } from '@/services/youtube/advancedChannelAnalytics';

async function callGemini(prompt: string, apiKey: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, channelId, url, question, context } = body;

    const config = await getApiConfig();

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

      const tryGemini = async () => {
        if (config.googleGeminiApiKey?.trim()) {
           const res = await callGemini(`${systemPrompt}\n\n${userPrompt}`, config.googleGeminiApiKey);
           try {
              const match = res.match(/\{[\s\S]*\}/);
              if (match) {
                  const parsed = JSON.parse(match[0]);
                  return parsed.recommendations || [];
              }
           } catch(e) {
              console.error('Gemini parse error:', e);
           }
        }
        return [];
      };

      if (config.openaiApiKey?.trim()) {
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: config.openaiApiKey });
          const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' }
          });
          const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
          recommendations = parsed.recommendations || [];
        } catch (openaiError: any) {
          console.error('OpenAI failed, falling back to Gemini:', openaiError.message);
          recommendations = await tryGemini();
        }
      } else {
        recommendations = await tryGemini();
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

      const tryGeminiAsk = async () => {
        if (config.googleGeminiApiKey?.trim()) {
          const answer = await callGemini(`${systemPrompt}\n\nUser Question: ${question}`, config.googleGeminiApiKey);
          return answer;
        }
        return null;
      };

      if (config.openaiApiKey?.trim()) {
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: config.openaiApiKey });
          const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: question },
            ],
          });
          return NextResponse.json({ answer: res.choices[0]?.message?.content });
        } catch (openaiError: any) {
          console.error('OpenAI Ask failed, falling back to Gemini:', openaiError.message);
          const answer = await tryGeminiAsk();
          if (answer) return NextResponse.json({ answer });
        }
      }

      const backupAnswer = await tryGeminiAsk();
      if (backupAnswer) return NextResponse.json({ answer: backupAnswer });

      return NextResponse.json({ error: 'AI Keys not configured or invalid' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('Admin Audit Error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
