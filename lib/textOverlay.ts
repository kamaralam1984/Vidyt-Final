/**
 * High-CTR Text Overlay Engine — 6 YouTube-proven title styles.
 * Client-side Canvas API. No external dependencies.
 */

export type TextStyle = 'mrbeast' | 'youtube' | 'neon' | 'breaking' | 'minimal' | 'cinematic';
export type BgStyle = 'dark' | 'fire' | 'ocean' | 'cosmic' | 'forest' | 'sunset' | 'none';

interface OverlayOptions {
  style?: TextStyle;
  position?: 'top' | 'center' | 'bottom';
  color?: string;
  glowColor?: string;
  fontSize?: number;
  bgStyle?: BgStyle;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.toUpperCase().split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, fontDef: (s: number) => string) {
  let size = startSize;
  ctx.font = fontDef(size);
  let lines = wrapLines(ctx, text, maxWidth);
  while (lines.length > 3 && size > 24) {
    size = Math.round(size * 0.82);
    ctx.font = fontDef(size);
    lines = wrapLines(ctx, text, maxWidth);
  }
  return { size, lines };
}

// Draws a gradient background — visible through transparent subject images (remove.bg results),
// invisible under fully opaque images since they cover it entirely.
function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number, bgStyle: BgStyle) {
  if (bgStyle === 'none') return;

  const presets: Record<Exclude<BgStyle, 'none'>, [string, string]> = {
    dark:   ['#060610', '#181838'],
    fire:   ['#180000', '#5a1400'],
    ocean:  ['#001828', '#003a70'],
    cosmic: ['#08001a', '#250055'],
    forest: ['#001208', '#003a18'],
    sunset: ['#1a0500', '#4a1600'],
  };
  const [outer, inner] = presets[bgStyle as Exclude<BgStyle, 'none'>] ?? presets.dark;

  // Radial gradient: lighter in the center, darker at edges (cinematic depth)
  const grad = ctx.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Edge vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, Math.max(W, H) * 0.88);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

// ─── Style renderers ───────────────────────────────────────────────────────

function drawMrBeast(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.18;
  ctx.textAlign = 'center';
  const cx = W / 2;

  const bandH = lines.length * lineH + fontSize * 0.7;
  const bandY = startY - fontSize * 0.9;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(0,0,0,0.9)');
  band.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);

  // Yellow accent side bars
  const barW = Math.max(6, W * 0.007);
  ctx.fillStyle = '#FFE000';
  ctx.fillRect(0, bandY, barW, bandH);
  ctx.fillRect(W - barW, bandY, barW, bandH);

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(10, fontSize * 0.2);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;
    ctx.strokeText(lines[i], cx, y);

    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    const grad = ctx.createLinearGradient(0, y - fontSize, 0, y);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.35, '#FFE900');
    grad.addColorStop(1, '#FF7A00');
    ctx.fillStyle = grad;
    ctx.fillText(lines[i], cx, y);

    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    const hl = ctx.createLinearGradient(0, y - fontSize, 0, y - fontSize * 0.45);
    hl.addColorStop(0, 'rgba(255,255,255,0.55)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fillText(lines[i], cx, y);
  }
}

function drawYouTube(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.2;
  ctx.textAlign = 'center';
  const cx = W / 2;

  // Natural gradient scrim — fades smoothly into the image
  const scrimH = lines.length * lineH + fontSize * 1.6;
  const scrimY = startY - fontSize * 1.2;
  const scrim = ctx.createLinearGradient(0, scrimY - H * 0.1, 0, scrimY + scrimH);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(0.25, 'rgba(0,0,0,0.55)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, scrimY - H * 0.1, W, scrimH + H * 0.1);

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;

    // Black outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(8, fontSize * 0.16);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.strokeText(lines[i], cx, y);

    // Red glow stroke
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#CC0000';
    ctx.lineWidth = fontSize * 0.055;
    ctx.strokeText(lines[i], cx, y);

    // White fill
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[i], cx, y);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  }

  // Red underline bar
  const lastY = startY + (lines.length - 1) * lineH + fontSize * 0.18;
  const barW = Math.min(W * 0.6, ctx.measureText(lines[lines.length - 1] || '').width + 50);
  ctx.fillStyle = '#FF0000';
  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = 14;
  ctx.fillRect(cx - barW / 2, lastY, barW, Math.max(4, fontSize * 0.07));
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
}

function drawNeon(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.2;
  ctx.textAlign = 'center';
  const cx = W / 2;

  const bandH = lines.length * lineH + fontSize * 1.0;
  const bandY = startY - fontSize;
  ctx.fillStyle = 'rgba(0,0,16,0.9)';
  ctx.fillRect(0, bandY, W, bandH);

  // Scanlines
  for (let sy = bandY; sy < bandY + bandH; sy += 4) {
    ctx.fillStyle = 'rgba(0,255,255,0.025)';
    ctx.fillRect(0, sy, W, 1);
  }

  // Neon border lines top/bottom
  const borderCols = ['#00FFFF', '#FF00FF'];
  for (let b = 0; b < 2; b++) {
    ctx.strokeStyle = borderCols[b];
    ctx.lineWidth = 2;
    ctx.shadowColor = borderCols[b];
    ctx.shadowBlur = 20;
    const by = b === 0 ? bandY : bandY + bandH;
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
  }
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

  const NEON_COLORS = ['#00FFFF', '#FF00FF', '#00FF88', '#FF4400', '#FFDD00'];

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    const neonColor = NEON_COLORS[i % NEON_COLORS.length];
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;

    // Multi-pass glow
    for (let g = 3; g >= 1; g--) {
      ctx.strokeStyle = neonColor;
      ctx.lineWidth = g * 3.5;
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = g * 18;
      ctx.strokeText(lines[i], cx, y);
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize * 0.1;
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.strokeText(lines[i], cx, y);

    ctx.shadowColor = neonColor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[i], cx, y);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  }
}

function drawBreaking(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.15;
  ctx.textAlign = 'center';
  const cx = W / 2;

  const bannerPad = fontSize * 0.45;
  const bannerH = lines.length * lineH + bannerPad * 2;
  const bannerY = startY - fontSize - bannerPad;

  ctx.fillStyle = '#CC0000';
  ctx.fillRect(0, bannerY, W, bannerH);

  const innerGrad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
  innerGrad.addColorStop(0, 'rgba(160,0,0,0.5)');
  innerGrad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
  innerGrad.addColorStop(1, 'rgba(160,0,0,0.5)');
  ctx.fillStyle = innerGrad;
  ctx.fillRect(0, bannerY, W, bannerH);

  const stripeH = Math.max(4, fontSize * 0.065);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, bannerY, W, stripeH);
  ctx.fillRect(0, bannerY + bannerH - stripeH, W, stripeH);

  const chipW = fontSize * 3.2;
  const chipH = fontSize * 0.58;
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(W * 0.03, bannerY + bannerH / 2 - chipH / 2, chipW, chipH);
  ctx.font = `900 ${Math.round(fontSize * 0.38)}px "Impact", "Arial Black", sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ BREAKING', W * 0.03 + 8, bannerY + bannerH / 2 + chipH * 0.18);
  ctx.textAlign = 'center';

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize * 0.13;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.strokeText(lines[i], cx, y);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[i], cx, y);
  }
}

function drawMinimal(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.25;
  ctx.textAlign = 'center';
  const cx = W / 2;

  const bandH = lines.length * lineH + fontSize * 0.85;
  const bandY = startY - fontSize * 0.95;
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.fillRect(0, bandY, W, bandH);

  // Drop shadow under band
  const shad = ctx.createLinearGradient(0, bandY + bandH, 0, bandY + bandH + 10);
  shad.addColorStop(0, 'rgba(0,0,0,0.22)');
  shad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shad;
  ctx.fillRect(0, bandY + bandH, W, 10);

  // Red accent bar left + top line
  const acW = Math.max(8, W * 0.009);
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, bandY, acW, bandH);
  ctx.fillRect(0, bandY, W, Math.max(2, fontSize * 0.03));

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `900 ${fontSize}px "Arial Black", "Impact", sans-serif`;
    ctx.fillStyle = '#111111';
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(lines[i], cx, y);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  }
}

function drawCinematic(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.35;
  ctx.textAlign = 'center';
  const cx = W / 2;

  // Letterbox bars
  const barH = Math.round(H * 0.09);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, barH);
  ctx.fillRect(0, H - barH, W, barH);

  // Vignette overlay
  const vig = ctx.createRadialGradient(cx, H / 2, H * 0.12, cx, H / 2, Math.max(W, H) * 0.82);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.65, 'rgba(0,0,0,0.28)');
  vig.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Gradient scrim under text
  const textH = lines.length * lineH + fontSize;
  const textGradY = startY - fontSize;
  const tGrad = ctx.createLinearGradient(0, textGradY, 0, textGradY + textH);
  tGrad.addColorStop(0, 'rgba(0,0,0,0)');
  tGrad.addColorStop(0.4, 'rgba(0,0,0,0.5)');
  tGrad.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = tGrad;
  ctx.fillRect(0, textGradY, W, textH);

  // Gold separator line above text
  const sepY = startY - fontSize * 1.35;
  const sepW = Math.min(W * 0.5, 420);
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 10;
  ctx.fillRect(cx - sepW / 2, sepY, sepW, Math.max(2, fontSize * 0.04));
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `800 ${fontSize}px "Impact", "Arial Black", sans-serif`;

    // Outer dark stroke
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(6, fontSize * 0.12);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.strokeText(lines[i], cx, y);

    // Gold glow
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 38;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Gold gradient fill
    const grad = ctx.createLinearGradient(0, y - fontSize, 0, y);
    grad.addColorStop(0, '#FFFDE7');
    grad.addColorStop(0.3, '#FFD700');
    grad.addColorStop(0.7, '#FFA000');
    grad.addColorStop(1, '#FF6F00');
    ctx.fillStyle = grad;
    ctx.fillText(lines[i], cx, y);

    // Top shimmer
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    const shimmer = ctx.createLinearGradient(0, y - fontSize, 0, y - fontSize * 0.42);
    shimmer.addColorStop(0, 'rgba(255,255,255,0.52)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shimmer;
    ctx.fillText(lines[i], cx, y);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────

export async function addTextOverlay(
  imageUrl: string,
  text: string,
  options?: OverlayOptions
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const W = img.naturalWidth || 1280;
      const H = img.naturalHeight || 720;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(imageUrl); return; }

      // Always draw background first.
      // For opaque images: fully covered by the image drawn next.
      // For transparent images (remove.bg result): shows through as the backdrop.
      drawBackground(ctx, W, H, options?.bgStyle ?? 'none');

      ctx.drawImage(img, 0, 0, W, H);

      const style: TextStyle = options?.style || 'youtube';
      const position = options?.position || 'bottom';

      const maxWidth = W * 0.88;
      // W/12 gives ~107px at 1280 — readable but not overwhelming
      const baseFontSize = options?.fontSize || Math.round(W / 12);
      const fontDef = (s: number) => `900 ${s}px "Impact", "Arial Black", sans-serif`;
      ctx.font = fontDef(baseFontSize);

      const { size: fontSize, lines } = fitFont(ctx, text, maxWidth, baseFontSize, fontDef);
      const lineH = fontSize * 1.18;
      const totalH = lines.length * lineH;

      let startY: number;
      if (position === 'top') {
        startY = fontSize + H * 0.05;
      } else if (position === 'center') {
        startY = (H - totalH) / 2 + fontSize;
      } else {
        startY = H - totalH - H * 0.06;
      }

      switch (style) {
        case 'mrbeast':   drawMrBeast(ctx, lines, W, H, startY, fontSize); break;
        case 'neon':      drawNeon(ctx, lines, W, H, startY, fontSize); break;
        case 'breaking':  drawBreaking(ctx, lines, W, H, startY, fontSize); break;
        case 'minimal':   drawMinimal(ctx, lines, W, H, startY, fontSize); break;
        case 'cinematic': drawCinematic(ctx, lines, W, H, startY, fontSize); break;
        default:          drawYouTube(ctx, lines, W, H, startY, fontSize); break;
      }

      // Watermark
      const wm = Math.round(W / 55);
      ctx.font = `500 ${wm}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(200,200,200,0.55)';
      ctx.textAlign = 'right';
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.fillText('vidyt.com', W - 12, H - 8);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}
