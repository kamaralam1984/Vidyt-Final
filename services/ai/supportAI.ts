import OpenAI from 'openai';
import { cosineSimilarity, getTextEmbedding } from '@/services/ai/embeddings';

export type TicketCategory = 'billing' | 'technical_issue' | 'account' | 'feature_request' | 'other';

export type TicketAiAnalysis = {
  category: TicketCategory;
  confidence: number;
  shouldAutoReply: boolean;
  aiReply: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

function sanitizeCategory(category: string): TicketCategory {
  const val = category.toLowerCase().trim();
  if (val === 'billing') return 'billing';
  if (val === 'technical issue' || val === 'technical_issue' || val === 'technical') return 'technical_issue';
  if (val === 'account') return 'account';
  if (val === 'feature request' || val === 'feature_request') return 'feature_request';
  return 'other';
}

export async function analyzeAndDraftSupportReply(input: {
  apiKey: string;
  subject: string;
  message: string;
  userPlan: string;
  confidenceThreshold?: number;
}): Promise<TicketAiAnalysis> {
  const confidenceThreshold = typeof input.confidenceThreshold === 'number' ? input.confidenceThreshold : 0.75;
  const openai = new OpenAI({ apiKey: input.apiKey });

  const prompt = [
    'You are a senior SaaS support automation assistant.',
    'Analyze user ticket and respond in strict JSON only.',
    'Categories allowed: billing, technical_issue, account, feature_request, other.',
    'JSON shape:',
    '{"category":"...","confidence":0.0-1.0,"reply":"..."}',
    `Plan: ${input.userPlan}`,
    `Subject: ${input.subject}`,
    `Message: ${input.message}`,
  ].join('\n');

  // Embedding-based category prior (advanced NLP upgrade).
  const ticketText = `${input.subject}\n${input.message}`.trim();
  let embeddingCategory: TicketCategory = 'other';
  let embeddingConfidence = 0;
  const ticketEmb = await getTextEmbedding(input.apiKey, ticketText);
  if (ticketEmb) {
    const prototypes: Array<{ cat: TicketCategory; text: string }> = [
      { cat: 'billing', text: 'invoice payment subscription renewal refund charged billing issue' },
      { cat: 'technical_issue', text: 'error bug crash not working failure timeout upload issue api issue' },
      { cat: 'account', text: 'login password account access profile authentication token' },
      { cat: 'feature_request', text: 'feature request improvement add capability suggestion roadmap' },
      { cat: 'other', text: 'general query help question' },
    ];
    let best = { cat: 'other' as TicketCategory, score: -1 };
    for (const p of prototypes) {
      const emb = await getTextEmbedding(input.apiKey, p.text);
      if (!emb) continue;
      const score = cosineSimilarity(ticketEmb, emb);
      if (score > best.score) best = { cat: p.cat, score };
    }
    embeddingCategory = best.cat;
    embeddingConfidence = Math.max(0, Math.min(1, (best.score + 1) / 2));
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Return valid JSON only. Keep reply concise, empathetic, and include immediate troubleshooting steps.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 500,
  });

  const content = completion.choices?.[0]?.message?.content || '{}';
  let parsed: any = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  const llmCategory = sanitizeCategory(String(parsed.category || 'other'));
  const confidenceRaw = Number(parsed.confidence || 0);
  const confidence = Math.max(0, Math.min(1, confidenceRaw));
  const aiReply = String(parsed.reply || '').trim();
  const category = confidence >= embeddingConfidence ? llmCategory : embeddingCategory;
  const finalConfidence = Math.max(confidence, embeddingConfidence);

  return {
    category,
    confidence: finalConfidence,
    shouldAutoReply: finalConfidence >= confidenceThreshold && aiReply.length > 0,
    aiReply,
    tokenUsage: completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        }
      : undefined,
  };
}
