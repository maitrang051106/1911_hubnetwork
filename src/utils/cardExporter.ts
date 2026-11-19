import type { Member } from '../data/members';

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * Generates and downloads a 1080x1350 editorial International Men's Day tribute card PNG
 * using the member's cropped portrait — 100% client-side.
 */
export async function downloadMemberCard(member: Member): Promise<void> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Ensure fonts are ready
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Deep nocturnal obsidian backdrop
  const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.25, 60, width * 0.5, height * 0.5, 920);
  bgGrad.addColorStop(0, '#131926');
  bgGrad.addColorStop(0.55, '#070a10');
  bgGrad.addColorStop(1, '#020305');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle ambient flower glow accent behind portrait
  const glow = ctx.createRadialGradient(width * 0.5, 450, 30, width * 0.5, 450, 420);
  glow.addColorStop(0, `${member.accentHex}38`);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Delicate floating nocturnal stardust dots
  for (let i = 0; i < 65; i++) {
    const px = ((i * 197.3) % width);
    const py = ((i * 311.7) % height);
    const r = 1 + (i % 3) * 0.9;
    ctx.fillStyle = i % 4 === 0 ? `${member.accentHex}88` : 'rgba(245, 239, 226, 0.25)';
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer fine editorial hairline border
  ctx.strokeStyle = 'rgba(245, 239, 226, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  // Top header row
  ctx.fillStyle = 'rgba(245, 239, 226, 0.72)';
  ctx.font = '500 22px Manrope, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('19.11 · NGÀY QUỐC TẾ ĐÀN ÔNG', 86, 108);

  ctx.textAlign = 'right';
  ctx.fillStyle = member.accentHex;
  ctx.fillText(`CHÂN DUNG ${member.index} / 05`, width - 86, 108);

  // Load and draw cropped portrait cleanly in 3:4 frame
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = member.portrait;
  });

  const frameW = 540;
  const frameH = 720;
  const frameX = (width - frameW) / 2;
  const frameY = 154;

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, 8);
    ctx.clip();

    // Cover crop math
    const scale = Math.max(frameW / img.width, frameH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = frameX + (frameW - drawW) / 2;
    const drawY = frameY + (frameH - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Subtle bottom editorial scrim
    const scrim = ctx.createLinearGradient(0, frameY + frameH - 180, 0, frameY + frameH);
    scrim.addColorStop(0, 'rgba(3, 5, 10, 0)');
    scrim.addColorStop(1, 'rgba(3, 5, 10, 0.78)');
    ctx.fillStyle = scrim;
    ctx.fillRect(frameX, frameY + frameH - 180, frameW, 180);
    ctx.restore();

    ctx.strokeStyle = 'rgba(245, 239, 226, 0.34)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, 8);
    ctx.stroke();
  }

  // Member name in tall condensed display style
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5efe2';
  ctx.font = '400 84px Oswald, sans-serif';
  ctx.fillText(member.name.toUpperCase(), width / 2, 972);

  // Traits separated by middots (clean typography, no pills)
  ctx.fillStyle = member.accentHex;
  ctx.font = '500 22px Manrope, sans-serif';
  ctx.fillText(member.traits.join('  ·  '), width / 2, 1020);

  // Subtle horizontal divider
  ctx.strokeStyle = 'rgba(245, 239, 226, 0.2)';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 110, 1054);
  ctx.lineTo(width / 2 + 110, 1054);
  ctx.stroke();

  // Signature wish
  ctx.fillStyle = 'rgba(245, 239, 226, 0.88)';
  ctx.font = '400 27px Manrope, sans-serif';
  wrapText(ctx, `“${member.signatureWish}”`, width / 2, 1110, 820, 42);

  // Footer signature
  ctx.fillStyle = 'rgba(245, 239, 226, 0.48)';
  ctx.font = '500 18px Manrope, sans-serif';
  ctx.fillText('HUB NETWORK  ·  19.11  ·  BẢN LĨNH, RẠNG NGỜI', width / 2, 1280);

  const link = document.createElement('a');
  link.download = `thiep-19-11-${member.id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
