import OpenAI from 'openai';
import { getApiConfig } from './apiConfig';

export interface ImageGeneratorResult {
  url: string;
  provider: string;
  isFallback: boolean;
  warning?: string;
}

/**
 * Generates an image using the best available provider.
 * Fallback chain: OpenAI DALL-E 3 -> Hugging Face -> Pollinations AI (Free)
 */
export async function generateAIImage(
  prompt: string,
  niche: string = 'entertainment'
): Promise<ImageGeneratorResult> {
  const config = await getApiConfig();
  let lastError: any = null;

  // 1. Try OpenAI DALL-E 3 (Paid)
  if (config.openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const imgRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1792x1024",
      });

      if (imgRes.data?.[0]?.url) {
        return {
          url: imgRes.data[0].url,
          provider: 'openai',
          isFallback: false
        };
      }
    } catch (e: any) {
      console.warn('[ImageGen] OpenAI DALL-E failed:', e.message);
      lastError = e;
    }
  }

  // 2. Try Hugging Face (Free Tier / Paid)
  if (config.huggingfaceApiKey) {
    try {
      // Using FLUX.1-schnell which is high-quality and modern
      const model = "black-forest-labs/FLUX.1-schnell";
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          headers: { 
            Authorization: `Bearer ${config.huggingfaceApiKey}`,
            "Content-Type": "application/json"
          },
          method: "POST",
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          url: `data:image/jpeg;base64,${base64}`,
          provider: 'huggingface (flux)',
          isFallback: true,
          warning: 'OpenAI Quota Exceeded. Used Flux-HF fallback.'
        };
      } else {
        const errText = await res.text();
        console.warn('[ImageGen] Hugging Face failed with status:', res.status, errText);
      }
    } catch (e: any) {
      console.warn('[ImageGen] Hugging Face fallback failed:', e.message);
      lastError = e;
    }
  }

  // 3. Ultimate Fallback: Pollinations AI (Free / No Key)
  // This is a reliable way to ensure NO ERROR is shown to the user.
  try {
    const seed = Math.floor(Math.random() * 1000000);
    // Extract the key scene/topic from complex prompt for Pollinations (handles simple prompts better)
    // Keep topic-related parts, remove text overlay instructions
    const cleanedPrompt = prompt
      .replace(/BOLD 3D TEXT:[\s\S]*?\./g, '')
      .replace(/TITLE TEXT:[\s\S]*?\./g, '')
      .replace(/BOTTOM BAR:[\s\S]*?\./g, '')
      .replace(/PROFESSIONAL TEXT:[\s\S]*?\./g, '')
      .replace(/Text must be.*?\./g, '')
      .replace(/\n+/g, ' ')
      .trim();
    // Use up to 500 chars for better topic accuracy
    const shortPrompt = cleanedPrompt.length > 500 ? cleanedPrompt.substring(0, 500) : cleanedPrompt;
    const encodedPrompt = encodeURIComponent(shortPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;
    
    // Fetch on server-side to avoid CORS/loading issues and convert to base64
    const pollRes = await fetch(pollinationsUrl);
    if (pollRes.ok) {
      const buffer = await pollRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return {
        url: `data:image/jpeg;base64,${base64}`,
        provider: 'pollinations',
        isFallback: true,
        warning: 'Used free-tier AI image generator (Pollinations).'
      };
    }
  } catch (e: any) {
    console.error('[ImageGen] Pollinations failed:', e.message);
  }

  // 4. Absolute Fallback: High Quality Placeholder
  const nichePlaceholders: Record<string, string> = {
    news: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1024&q=80',
    gaming: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1024&q=80',
    entertainment: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1024&q=80',
    education: 'https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&w=1024&q=80'
  };

  return {
    url: nichePlaceholders[niche] || nichePlaceholders.entertainment,
    provider: 'placeholder',
    isFallback: true,
    warning: 'AI systems busy. Using high-quality placeholder.'
  };
}
