/**
 * Overlay bold 3D VFX text on an image using Canvas API.
 * Works client-side in browser.
 */
export async function addTextOverlay(
  imageUrl: string,
  text: string,
  options?: { fontSize?: number; color?: string; glowColor?: string; position?: 'top' | 'center' | 'bottom' }
): Promise<string> {
  return new Promise((resolve, reject) => {
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

      // Draw base image
      ctx.drawImage(img, 0, 0, W, H);

      // Dark gradient overlay for text readability
      const pos = options?.position || 'top';
      if (pos === 'top') {
        const grad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
        grad.addColorStop(0, 'rgba(0,0,0,0.7)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H * 0.5);
      } else if (pos === 'bottom') {
        const grad = ctx.createLinearGradient(0, H * 0.5, 0, H);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, H * 0.5, W, H * 0.5);
      } else {
        const grad = ctx.createLinearGradient(0, H * 0.25, 0, H * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0.5)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, H * 0.25, W, H * 0.5);
      }

      // Calculate font size to fit width
      const maxWidth = W * 0.85;
      let fontSize = options?.fontSize || Math.round(W / 10);
      ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;

      // Word wrap text into lines
      const words = text.toUpperCase().split(' ');
      let lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // If too many lines, reduce font
      if (lines.length > 3) {
        fontSize = Math.round(fontSize * 0.75);
        ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
        lines = [];
        currentLine = '';
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
      }

      const lineHeight = fontSize * 1.15;
      const totalTextHeight = lines.length * lineHeight;
      let startY: number;
      if (pos === 'top') startY = fontSize + H * 0.05;
      else if (pos === 'bottom') startY = H - totalTextHeight - H * 0.05;
      else startY = (H - totalTextHeight) / 2 + fontSize;

      const glowColor = options?.glowColor || '#FF4400';
      const textColor = options?.color || '#FFFFFF';

      ctx.textAlign = 'center';
      const centerX = W / 2;

      for (let i = 0; i < lines.length; i++) {
        const y = startY + i * lineHeight;
        const line = lines[i];

        // Layer 1: Outer glow (red/orange)
        ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 8;
        ctx.strokeText(line, centerX, y);

        // Layer 2: Dark outline for 3D depth
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText(line, centerX, y);

        // Layer 3: White/bright fill
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = textColor;
        ctx.fillText(line, centerX, y);

        // Layer 4: Inner highlight (top half gradient)
        ctx.save();
        ctx.clip();
        const highlightGrad = ctx.createLinearGradient(0, y - fontSize, 0, y);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGrad;
        ctx.fillText(line, centerX, y);
        ctx.restore();
      }

      // Bottom bar
      const barH = H * 0.06;
      const barGrad = ctx.createLinearGradient(0, H - barH, 0, H);
      barGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
      barGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, H - barH, W, barH);

      ctx.font = `600 ${Math.round(W / 50)}px Arial, sans-serif`;
      ctx.fillStyle = '#AAAAAA';
      ctx.textAlign = 'center';
      ctx.fillText('Powered by VidYT — AI Video Optimization Platform', W / 2, H - barH / 3);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}
