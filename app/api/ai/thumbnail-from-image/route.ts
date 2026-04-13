export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import { getApiConfig } from '@/lib/apiConfig';
import { analyzeImage } from '@/lib/ai-vision';
import { generateAIImage } from '@/lib/ai-image';
import { removeBackground, compositeThumbnail } from '@/lib/ai-composite';
import sharp from 'sharp';

const NICHE_TEMPLATES: Record<string, { colors: string[]; visuals: string[]; layout: string }> = {
  news: { colors: ['#FF0000', '#FFFFFF', '#FFFF00', '#000000'], visuals: ['breaking news room', 'emergency alerts', 'digital screens', 'world map with red zones'], layout: 'subject left, bold text right, warning borders' },
  entertainment: { colors: ['#FF00FF', '#00FFFF', '#FFD700', '#000000'], visuals: ['sparkles', 'paparazzi flashes', 'colorful stage', 'spotlight beams'], layout: 'subject left, text right center, vibrant gradient bg' },
  gaming: { colors: ['#39FF14', '#FF00FF', '#000000', '#FFFFFF'], visuals: ['motion trails', 'cyberpunk city', 'neon grid floor', 'energy particles'], layout: 'subjects both sides, neon text center' },
  education: { colors: ['#007FFF', '#FFFFFF', '#F0F0F0', '#000000'], visuals: ['clean diagrams', 'modern office', 'gradient abstract'], layout: 'clean centered text, subject side' }
};

/**
 * Composite multiple foreground images onto a background
 * Image 1 → left side, Image 2 → right side (film poster style)
 */
async function compositeMultipleImages(
  bgUrlOrBase64: string,
  fgImages: string[]
): Promise<string> {
  try {
    let bgBuffer: Buffer;
    if (bgUrlOrBase64.startsWith('http')) {
      const res = await fetch(bgUrlOrBase64);
      bgBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      bgBuffer = Buffer.from(bgUrlOrBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    const bgMeta = await sharp(bgBuffer).metadata();
    const bgW = bgMeta.width || 1280;
    const bgH = bgMeta.height || 720;

    const composites: sharp.OverlayOptions[] = [];

    for (let i = 0; i < fgImages.length; i++) {
      const fgData = fgImages[i].replace(/^data:image\/\w+;base64,/, '');
      const fgBuf = Buffer.from(fgData, 'base64');

      // Resize each foreground to ~45% of bg width and full height
      const targetH = bgH;
      const targetW = Math.round(bgW * 0.45);
      const resized = await sharp(fgBuf)
        .resize({ width: targetW, height: targetH, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      const fgMeta = await sharp(resized).metadata();
      const fgW = fgMeta.width || targetW;

      if (i === 0) {
        // First image → left side
        composites.push({ input: resized, top: 0, left: 0 });
      } else {
        // Second image → right side
        composites.push({ input: resized, top: 0, left: bgW - fgW });
      }
    }

    const result = await sharp(bgBuffer)
      .composite(composites)
      .png()
      .toBuffer();

    return `data:image/png;base64,${result.toString('base64')}`;
  } catch (e: any) {
    console.error('[Composite] Multi-image composition failed:', e.message);
    return bgUrlOrBase64;
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'ai_thumbnail_maker');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json();
    let { imageBase64, emotion, niche, generateImage, customPrompt } = body;

    const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64].filter(Boolean);

    if (images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    niche = niche || 'entertainment';
    emotion = emotion || 'curiosity';

    // Step 1: Analyze first image for visual description
    const visionAnalysis = await analyzeImage(images[0], niche);

    // Use user's actual title & topic (priority) or fallback to AI vision
    const videoTitle = body.videoTitle || visionAnalysis.title;
    const topic = body.topic || visionAnalysis.topic;

    // The thumbnail text IS the actual title — no random power words
    const titleWords = videoTitle.split(/\s+/);
    let thumbnail_text = videoTitle;
    // If title is too long for thumbnail, shorten it smartly
    if (titleWords.length > 6) {
      thumbnail_text = titleWords.slice(0, 5).join(' ') + '...';
    }
    // Make it impactful — uppercase the key parts
    thumbnail_text = thumbnail_text.toUpperCase();

    const variations = [
      thumbnail_text,
      `${topic.toUpperCase()} — ${new Date().getFullYear()}`,
    ];

    // Step 2: Remove background from ALL uploaded images
    const transparentImages: string[] = [];
    for (const img of images) {
      const transparent = await removeBackground(img);
      if (transparent) {
        transparentImages.push(transparent);
      } else {
        // If BG removal fails, use original image as-is with some processing
        try {
          const rawBuf = Buffer.from(img.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          const processed = await sharp(rawBuf)
            .resize(600, 720, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
          transparentImages.push(`data:image/png;base64,${processed.toString('base64')}`);
        } catch {
          // Last resort: use raw base64
          transparentImages.push(img.startsWith('data:') ? img : `data:image/png;base64,${img}`);
        }
      }
    }

    const template = NICHE_TEMPLATES[niche] || NICHE_TEMPLATES.entertainment;
    const visual = template.visuals[Math.floor(Math.random() * template.visuals.length)];

    // Step 3: Generate AI background with film poster style prompt
    // Tell AI to leave space for subjects based on how many images uploaded
    const subjectPlacement = transparentImages.length >= 2
      ? 'Leave BOTH the left side and right side of the frame empty for subjects to be placed. The center area should have dramatic background only.'
      : 'Leave the left side of the frame completely empty for a subject. Right side and center have the dramatic background.';

    const image_prompt = customPrompt?.trim()
      ? `YouTube thumbnail 16:9 aspect ratio. ${customPrompt.trim()}. ${subjectPlacement}`
      : `Ultra high quality YouTube thumbnail, 16:9 aspect ratio, 8K resolution, cinematic film poster quality.

BOLD 3D TEXT: Massive bold 3D metallic text "${thumbnail_text}" at the TOP of the image. Chrome/gold metallic finish with strong drop shadow, glowing red-orange edges, embossed 3D effect like a Hollywood movie title. Text must be extremely large and clearly readable. Impact/block font style.

${subjectPlacement}

BACKGROUND: Epic cinematic ${visual} scene. Fire, explosions, dramatic sky with orange/red hues. Volumetric light rays, depth of field blur. War/action movie poster aesthetic.

BOTTOM BAR: Dark gradient bar at bottom with small subtitle text and icons, professional news/movie poster lower third.

STYLE: Hyper-realistic digital art, Hollywood blockbuster movie poster, professional compositing, magazine cover quality.
COLOR PALETTE: ${template.colors.join(', ')}, cinematic orange-teal color grading.
MOOD: ${emotion}, intense, powerful, dramatic tension.
EFFECTS: Lens flares, particle embers/sparks, volumetric fog, cinematic vignette, film grain.`;

    let image_url: string | undefined;
    let warning: string | undefined;
    let generationProvider = 'none';

    if (generateImage !== false) {
      try {
        const generation = await generateAIImage(image_prompt, niche);
        image_url = generation.url;
        generationProvider = generation.provider;
        if (generation.warning) warning = generation.warning;

        // Step 4: Composite ALL user images onto the AI background
        if (transparentImages.length > 0 && image_url) {
          try {
            if (transparentImages.length >= 2) {
              // Both images: left and right (film poster style)
              image_url = await compositeMultipleImages(image_url, transparentImages.slice(0, 2));
              generationProvider += ' + dual-composite';
            } else {
              // Single image: left side
              image_url = await compositeThumbnail(image_url, transparentImages[0]);
              generationProvider += ' + composite';
            }
          } catch (compError: any) {
            console.error('[Composite] Failed:', compError.message);
            warning = (warning || '') + ' Image compositing partially failed.';
          }
        }
      } catch (e: any) {
        console.error('AI Image Generation failed:', e.message);
        warning = 'AI image generation is temporarily unavailable.';
      }
    }

    // CTR scores based on what we have
    const hasFace = transparentImages.length > 0;
    const hasMultipleFaces = transparentImages.length >= 2;
    const baseCtr = 75;
    const faceCtrBonus = hasFace ? 12 : 0;
    const multiFaceBonus = hasMultipleFaces ? 5 : 0;
    const emotionBonus = ['shock', 'fear', 'urgency'].includes(emotion) ? 5 : 3;
    const ctr = Math.min(98, baseCtr + faceCtrBonus + multiFaceBonus + emotionBonus);

    return NextResponse.json({
      thumbnail_text,
      image_prompt,
      variations,
      ctr_scores: [ctr, ctr - 5, ctr - 8],
      reasoning: [
        hasFace ? 'User face/subject included — boosts trust & CTR' : 'No face detected',
        hasMultipleFaces ? '2 subjects create visual contrast & drama' : 'Single subject focus',
        'Cinematic film poster style with VFX effects',
        `Title "${thumbnail_text}" displayed on thumbnail`,
      ],
      design: {
        colors: template.colors,
        layout: template.layout,
        effects: 'cinematic glow, lens flare, particle effects, volumetric lighting, film grain'
      },
      image_url,
      original_title: videoTitle,
      original_topic: topic,
      warning,
      provider: visionAnalysis.provider,
      generationProvider,
      imagesUsed: transparentImages.length,
    });

  } catch (e: any) {
    console.error('Thumbnail from image error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to generate thumbnail from image', isCritical: true },
      { status: 500 }
    );
  }
}
