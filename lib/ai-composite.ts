import sharp from 'sharp';
import { getApiConfig } from './apiConfig';

/**
 * Removes background from an image using Hugging Face RMBG-1.4
 */
export async function removeBackground(imageBase64: string): Promise<string | null> {
  const config = await getApiConfig();
  if (!config.huggingfaceApiKey) return null;

  try {
    // Extract raw base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    let buffer = Buffer.from(base64Data, 'base64');

    // Resize to a reasonable size for HF RMBG (max 1024px) for stability
    try {
      const resized = await sharp(buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
      buffer = Buffer.from(resized);
    } catch (resizeErr) {
      console.warn('[Composite] Initial resize failed, using raw buffer');
    }

    const res = await fetch(
      "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
      {
        headers: { 
          Authorization: `Bearer ${config.huggingfaceApiKey}`,
          "Content-Type": "application/octet-stream"
        },
        method: "POST",
        body: buffer,
      }
    );

    if (!res.ok) {
      console.warn('[Composite] HF BG Removal failed:', res.status, await res.text());
      // Try fallback model if RMBG-1.4 is down
      const resFallback = await fetch(
        "https://api-inference.huggingface.co/models/Nielsrogge/rembg-onnx", 
        {
          headers: { Authorization: `Bearer ${config.huggingfaceApiKey}` },
          method: "POST",
          body: buffer,
        }
      );
      
      if (!resFallback.ok) {
        console.warn('[Composite] All HF BG Removal models failed');
        return null;
      }
      
      const resultBuffer = await resFallback.arrayBuffer();
      return `data:image/png;base64,${Buffer.from(resultBuffer).toString('base64')}`;
    }

    const resultBuffer = await res.arrayBuffer();
    console.log('[Composite] BG Removal successful');
    return `data:image/png;base64,${Buffer.from(resultBuffer).toString('base64')}`;
  } catch (e: any) {
    console.error('[Composite] BG Removal error:', e.message);
    return null;
  }
}

/**
 * Layers a foreground image (transparent) over a background image.
 */
export async function compositeThumbnail(
  bgUrlOrBase64: string,
  fgBase64: string
): Promise<string> {
  try {
    let bgBuffer: Buffer;
    if (bgUrlOrBase64.startsWith('http')) {
      const res = await fetch(bgUrlOrBase64);
      const arrayBuffer = await res.arrayBuffer();
      bgBuffer = Buffer.from(arrayBuffer);
    } else {
      const bgData = bgUrlOrBase64.replace(/^data:image\/\w+;base64,/, "");
      bgBuffer = Buffer.from(bgData, 'base64');
    }

    const fgData = fgBase64.replace(/^data:image\/\w+;base64,/, "");
    const fgBuffer = Buffer.from(fgData, 'base64');

    // Resize fg to fit the height of the background (roughly)
    const bgMetadata = await sharp(bgBuffer).metadata();
    const bgWidth = bgMetadata.width || 1280;
    const bgHeight = bgMetadata.height || 720;

    // Process foreground: Resize and position on the left
    const processedFg = await sharp(fgBuffer)
      .resize({ height: bgHeight, fit: 'inside' })
      .toBuffer();

    const fgMetadata = await sharp(processedFg).metadata();
    const fgWidth = fgMetadata.width || 0;

    const compositeBuffer = await sharp(bgBuffer)
      .composite([
        { 
          input: processedFg, 
          top: 0, 
          left: 0, // YouTube style: subject on the left
          gravity: 'northwest' 
        }
      ])
      .png()
      .toBuffer();

    return `data:image/png;base64,${compositeBuffer.toString('base64')}`;
  } catch (e: any) {
    console.error('[Composite] Composition failed:', e.message);
    return bgUrlOrBase64; // Fallback to original BG
  }
}
