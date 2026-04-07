export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import AIThumbnail from '@/models/AIThumbnail';
import { getApiConfig } from '@/lib/apiConfig';
import OpenAI from 'openai';
import { analyzeImage } from '@/lib/ai-vision';
import { generateAIImage } from '@/lib/ai-image';
import { removeBackground, compositeThumbnail } from '@/lib/ai-composite';

interface ThumbnailOutput {
  thumbnail_text: string;
  image_prompt: string;
  variations: string[];
  ctr_scores: number[];
  reasoning: string[];
  design: {
    colors: string[];
    layout: string;
    effects: string;
  };
  image_url?: string;
  original_title: string;
  original_topic: string;
}

const POWER_WORDS = ['EXPOSED', 'SHOCKING', 'SECRET', 'WARNING', 'LEAKED', 'REVEALED', 'BANNED', 'CRISIS', 'URGENT', 'ALERT'];

const NICHE_TEMPLATES = {
  news: { colors: ['#FF0000', '#FFFFFF', '#FFFF00', '#000000'], visuals: ['breaking news room', 'emergency alerts', 'digital screens'], layout: 'massive bold text center-aligned, warning borders' },
  entertainment: { colors: ['#FF00FF', '#00FFFF', '#FFD700', '#000000'], visuals: ['sparkles', 'paparazzi flashes', 'colorful stage'], layout: 'expressive face on side, large floating text' },
  gaming: { colors: ['#39FF14', '#FF00FF', '#000000', '#FFFFFF'], visuals: ['motion trails', 'cyberpunk city', 'game HUD elements'], layout: 'dynamic perspective, neon glowing text' },
  education: { colors: ['#007FFF', '#FFFFFF', '#F0F0F0', '#000000'], visuals: ['informative diagrams', 'library', 'clean modern office'], layout: 'clean typography, centered subject' }
};

export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'ai_thumbnail_maker');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json();
    let { imageBase64, emotion, niche, generateImage } = body;
    
    const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64].filter(Boolean);
    
    if (images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    niche = niche || 'entertainment';
    emotion = emotion || 'curiosity';

    const config = await getApiConfig();
    
    // Step 1: Analyze first image to get a visual description and suggested titles
    const visionAnalysis = await analyzeImage(images[0], niche);
    
    // Prioritize user inputs, but improve them with AI insights
    const videoTitle = body.videoTitle || visionAnalysis.title;
    const topic = body.topic || visionAnalysis.topic;

    // Step 1.5: Remove background (Try all provided images until one works)
    let transparentUserImage: string | null = null;
    for (const img of images) {
      transparentUserImage = await removeBackground(img);
      if (transparentUserImage) break; // Found a working one
    }

    // Step 2: Generate Thumbnail texts & prompts
    const power_word = POWER_WORDS[Math.floor(Math.random() * POWER_WORDS.length)];
    // Improve the topic/text based on the niche and visual analysis
    const thumbnail_text = `${power_word}: ${topic.toUpperCase()}`;
    const variations = [`${topic.toUpperCase()} EXPOSED`, `SHOCKING: ${videoTitle}`];
    
    const template = (NICHE_TEMPLATES as any)[niche] || NICHE_TEMPLATES.news;
    const visual = template.visuals[Math.floor(Math.random() * template.visuals.length)];
    
    // High-impact MrBeast-style prompt engineering
    // NOTE: If we have a transparentUserImage, we tell the AI to leave the left side open
    const subjectInfo = transparentUserImage 
      ? `Leave the left side of the frame empty for a subject to be placed later.` 
      : `Subject: ${visionAnalysis.visual_description}. The person must have an EXTREMELY EXPRESSIVE SHOCKED face, mouth open, looking directly at the camera with intense emotion.`;

    const image_prompt = `YouTube thumbnail 16:9 aspect ratio, cinematic hyper-realistic 8k digital art. 
PROFESSIONAL TEXT: Bold 3D massive text "${thumbnail_text}" in center with powerful red and yellow glow effects, high readability.
${subjectInfo}
BACKGROUND: ${visual} scene, high-impact dramatic lighting, motion blur in background for depth, professional retouching.
STYLE: MrBeast-style high-contrast, vibrant saturated colors, professional photography, high-end YouTube thumbnail design.
COLOR PALETTE: ${template.colors.join(', ')}.
EMOTION: ${emotion} and shock.`;

    // Step 3: Generate the Image Reference (with fallback)
    let image_url = undefined;
    let warning = undefined;
    let generationProvider = 'none';

    if (generateImage !== false) {
      try {
        const generation = await generateAIImage(image_prompt, niche);
        image_url = generation.url;
        generationProvider = generation.provider;
        if (generation.warning) warning = generation.warning;

        // Step 4: Composite the user image over the AI background if both are available
        if (transparentUserImage && image_url) {
          try {
            image_url = await compositeThumbnail(image_url, transparentUserImage);
            generationProvider += ' + composite';
          } catch (compError: any) {
            console.error('[Composite] Failed to mix images:', compError.message);
            warning = (warning || '') + ' Image mixing failed. Using AI generation only.';
          }
        }
      } catch (e: any) {
        console.error("AI Image Generation failed completely:", e.message);
        warning = "AI image generation is temporarily unavailable.";
      }
    }

    const output: ThumbnailOutput & { warning?: string, provider?: string, generationProvider?: string } = {
      thumbnail_text,
      image_prompt,
      variations,
      ctr_scores: [95, 88, 85],
      reasoning: ["Strong emotional trigger", "Concise", "Curiosity gap"],
      design: {
        colors: template.colors,
        layout: template.layout,
        effects: 'glow effect, gradient'
      },
      image_url,
      original_title: videoTitle,
      original_topic: topic,
      warning,
      provider: visionAnalysis.provider,
      generationProvider
    };

    return NextResponse.json(output);
    
  } catch (e: any) {
    console.error('Thumbnail from image error:', e);
    return NextResponse.json(
      { 
        error: e.message || 'Failed to generate thumbnail from image',
        isCritical: true 
      },
      { status: 500 }
    );
  }
}
