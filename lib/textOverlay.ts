/**
 * High-CTR Text Overlay Engine — 5 YouTube-proven title styles.
 * Client-side Canvas API. No external dependencies.
 */

export type TextStyle = 'mrbeast' | 'youtube' | 'neon' | 'breaking' | 'minimal';

interface OverlayOptions {
  style?: TextStyle;
  position?: 'top' | 'center' | 'bottom';
  color?: string;
  glowColor?: string;
  fontSize?: number;
}

/** Wrap text into lines that fit within maxWidth */
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

/** Auto-shrink font until all lines fit in ≤3 rows */
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

// ─── Style renderers ───────────────────────────────────────────────────────

function drawMrBeast(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.18;
  ctx.textAlign = 'center';
  const cx = W / 2;

  // Dark band behind text
  const bandH = lines.length * lineH + fontSize * 0.6;
  const bandY = startY - fontSize * 0.9;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(0,0,0,0.85)');
  band.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;

    // Outer thick black stroke
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(10, fontSize * 0.18);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.strokeText(lines[i], cx, y);

    // Yellow fill (MrBeast signature)
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    const grad = ctx.createLinearGradient(0, y - fontSize, 0, y);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.4, '#FFE900');
    grad.addColorStop(1, '#FF8C00');
    ctx.fillStyle = grad;
    ctx.fillText(lines[i], cx, y);

    // Inner white highlight on top third
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    const hl = ctx.createLinearGradient(0, y - fontSize, 0, y - fontSize * 0.5);
    hl.addColorStop(0, 'rgba(255,255,255,0.5)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fillText(lines[i], cx, y);
  }
}

function drawYouTube(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.2;
  ctx.textAlign = 'center';
  const cx = W / 2;

  // Gradient scrim
  const scrimH = lines.length * lineH + fontSize;
  const scrimY = startY - fontSize;
  const scrim = ctx.createLinearGradient(0, scrimY - 20, 0, scrimY + scrimH + 20);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(0.15, 'rgba(0,0,0,0.75)');
  scrim.addColorStop(0.85, 'rgba(0,0,0,0.75)');
  scrim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, scrimY - 20, W, scrimH + 40);

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;

    // Deep drop shadow
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize * 0.14;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.strokeText(lines[i], cx, y);

    // Red glow
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#CC0000';
    ctx.lineWidth = fontSize * 0.06;
    ctx.strokeText(lines[i], cx, y);

    // White fill
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[i], cx, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // Red accent underline bar under last line
  const lastY = startY + (lines.length - 1) * lineH + fontSize * 0.15;
  const barW = Math.min(W * 0.5, ctx.measureText(lines[lines.length - 1] || '').width + 40);
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(cx - barW / 2, lastY, barW, Math.max(4, fontSize * 0.06));
}

function drawNeon(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.2;
  ctx.textAlign = 'center';
  const cx = W / 2;

  // Dark cyberpunk band
  const bandH = lines.length * lineH + fontSize * 0.8;
  const bandY = startY - fontSize * 0.9;
  ctx.fillStyle = 'rgba(0,0,20,0.82)';
  ctx.fillRect(0, bandY, W, bandH);

  // Neon border lines top/bottom of band
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(0, bandY); ctx.lineTo(W, bandY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, bandY + bandH); ctx.lineTo(W, bandY + bandH); ctx.stroke();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

  const NEON_COLORS = ['#00FFFF', '#FF00FF', '#00FF88', '#FF4400', '#FFDD00'];

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    const neonColor = NEON_COLORS[i % NEON_COLORS.length];
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;

    // Neon glow layers (3 passes with increasing blur)
    for (let g = 3; g >= 1; g--) {
      ctx.strokeStyle = neonColor;
      ctx.lineWidth = g * 3;
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = g * 15;
      ctx.strokeText(lines[i], cx, y);
    }

    // Black outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize * 0.1;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.strokeText(lines[i], cx, y);

    // White core fill
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[i], cx, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
}

function drawBreaking(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.15;
  ctx.textAlign = 'center';
  const cx = W / 2;

  // Full red banner background
  const bannerPad = fontSize * 0.4;
  const bannerH = lines.length * lineH + bannerPad * 2;
  const bannerY = startY - fontSize - bannerPad;

  ctx.fillStyle = '#CC0000';
  ctx.fillRect(0, bannerY, W, bannerH);

  // Inner dark red gradient
  const grad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
  grad.addColorStop(0, 'rgba(180,0,0,0.6)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.2)');
  grad.addColorStop(1, 'rgba(180,0,0,0.6)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, bannerY, W, bannerH);

  // Yellow top/bottom accent stripes
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, bannerY, W, Math.max(4, fontSize * 0.06));
  ctx.fillRect(0, bannerY + bannerH - Math.max(4, fontSize * 0.06), W, Math.max(4, fontSize * 0.06));

  // "BREAKING" label chip (left side)
  const chipW = fontSize * 2.8;
  const chipH = fontSize * 0.55;
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(W * 0.03, bannerY + bannerH / 2 - chipH / 2, chipW, chipH);
  ctx.font = `900 ${Math.round(fontSize * 0.38)}px "Impact", "Arial Black", sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ BREAKING', W * 0.03 + 8, bannerY + bannerH / 2 + chipH * 0.15);
  ctx.textAlign = 'center';

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fontSize * 0.12;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.strokeText(lines[i], cx, y);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[i], cx, y);
  }
}

function drawMinimal(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number, startY: number, fontSize: number) {
  const lineH = fontSize * 1.2;
  ctx.textAlign = 'center';
  const cx = W / 2;

  // White frosted band
  const bandH = lines.length * lineH + fontSize * 0.7;
  const bandY = startY - fontSize * 0.85;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillRect(0, bandY, W, bandH);

  // Left accent bar
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, bandY, Math.max(8, W * 0.008), bandH);

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.font = `900 ${fontSize}px "Arial Black", "Impact", sans-serif`;
    ctx.fillStyle = '#111111';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(lines[i], cx, y);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
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

      ctx.drawImage(img, 0, 0, W, H);

      const style: TextStyle = options?.style || 'youtube';
      const position = options?.position || 'bottom';

      // Font sizing
      const maxWidth = W * 0.88;
      const baseFontSize = options?.fontSize || Math.round(W / 9);
      const fontDef = (s: number) => `900 ${s}px "Impact", "Arial Black", sans-serif`;
      ctx.font = fontDef(baseFontSize);

      const { size: fontSize, lines } = fitFont(ctx, text, maxWidth, baseFontSize, fontDef);
      const lineH = fontSize * 1.18;
      const totalH = lines.length * lineH;

      // Calculate Y start position
      let startY: number;
      if (position === 'top') {
        startY = fontSize + H * 0.05;
      } else if (position === 'center') {
        startY = (H - totalH) / 2 + fontSize;
      } else {
        // bottom
        startY = H - totalH - H * 0.08;
      }

      // Render chosen style
      switch (style) {
        case 'mrbeast':  drawMrBeast(ctx, lines, W, H, startY, fontSize); break;
        case 'neon':     drawNeon(ctx, lines, W, H, startY, fontSize); break;
        case 'breaking': drawBreaking(ctx, lines, W, H, startY, fontSize); break;
        case 'minimal':  drawMinimal(ctx, lines, W, H, startY, fontSize); break;
        default:         drawYouTube(ctx, lines, W, H, startY, fontSize); break;
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
