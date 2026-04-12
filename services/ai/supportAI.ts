import { askSecureChatbot } from '@/lib/secureChatbot';

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

export async function analyzeAndDraftSupportReply(input: {
  apiKey?: string;
  subject: string;
  message: string;
  userPlan: string;
  confidenceThreshold?: number;
}): Promise<TicketAiAnalysis> {
  const confidenceThreshold = typeof input.confidenceThreshold === 'number' ? input.confidenceThreshold : 0.75;
  const text = `${input.subject}\n${input.message}`.toLowerCase();
  let category: TicketCategory = 'other';
  let finalConfidence = 0.76;
  if (/billing|invoice|payment|refund|charge|subscription|renew/.test(text)) {
    category = 'billing';
    finalConfidence = 0.9;
  } else if (/error|bug|crash|failed|timeout|not working|exception|upload/.test(text)) {
    category = 'technical_issue';
    finalConfidence = 0.88;
  } else if (/login|account|profile|password|otp|verify/.test(text)) {
    category = 'account';
    finalConfidence = 0.86;
  } else if (/feature request|feature|improve|suggestion|roadmap/.test(text)) {
    category = 'feature_request';
    finalConfidence = 0.8;
  }

  const secured = await askSecureChatbot({
    botName: 'VidYT Support Assistant',
    question: input.message,
    plan: input.userPlan,
    functions: ['support_chat', 'subscription_help', 'account_help', 'product_guidance'],
    behaviorPrompt:
      'Tone should be empathetic and concise. Give immediate troubleshooting steps and next action. Never expose internal data.',
    context: `Subject: ${input.subject}\nDetected category: ${category}`,
    localFallback:
      'Thanks for contacting support. Please share exact steps + screenshot/error text. We will guide you quickly with next troubleshooting steps.',
  });

  return {
    category,
    confidence: finalConfidence,
    shouldAutoReply: finalConfidence >= confidenceThreshold && secured.reply.length > 0,
    aiReply: secured.reply,
    tokenUsage: undefined,
  };
}
