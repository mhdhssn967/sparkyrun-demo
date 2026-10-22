import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { CHUNK_LENGTH, LANE_WIDTH, ROAD_HALF_WIDTH } from '../game/constants';

const TILE_LENGTH = 6; // metres of road covered by one texture tile (one dash + one gap)

/** Asphalt with lane dashes, edge lines and maroon kerb stripes. One tile = 13.2 m x 6 m. */
export function createRoadTexture(): CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d')!;
  const px = (metresFromCentre: number) => ((metresFromCentre + ROAD_HALF_WIDTH) / (ROAD_HALF_WIDTH * 2)) * w;

  // Rich charcoal-grey asphalt base with high readability
  g.fillStyle = '#343840';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#2b2e36';
  g.fillRect(0, 0, px(-LANE_WIDTH * 1.5), h);
  g.fillRect(px(LANE_WIDTH * 1.5), 0, w, h);

  // Subtle realistic asphalt micro-noise
  for (let i = 0; i < 2200; i++) {
    const v = 46 + Math.random() * 24;
    g.fillStyle = `rgba(${v},${v + 2},${v + 4},0.22)`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }

  // Crisp, high-contrast white lane dashes
  g.fillStyle = '#ffffff';
  for (const lx of [-LANE_WIDTH / 2, LANE_WIDTH / 2]) {
    g.fillRect(px(lx) - 3.5, 0, 7, h * 0.48);
  }
  // Solid white outer lane boundaries
  for (const ex of [-LANE_WIDTH * 1.5, LANE_WIDTH * 1.5]) {
    g.fillRect(px(ex) - 3.5, 0, 7, h);
  }

  // Alternating red & white racing curb blocks (matching the reference screenshot)
  const curbSegments = 4;
  const segHeight = h / curbSegments;
  for (let s = 0; s < curbSegments; s++) {
    const isRed = s % 2 === 0;
    g.fillStyle = isRed ? '#e51937' : '#ffffff';
    const yStart = s * segHeight;
    // Left curb
    g.fillRect(0, yStart, px(-ROAD_HALF_WIDTH + 0.65), segHeight);
    // Right curb
    g.fillRect(px(ROAD_HALF_WIDTH - 0.65), yStart, w - px(ROAD_HALF_WIDTH - 0.65), segHeight);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, CHUNK_LENGTH / TILE_LENGTH);
  texture.anisotropy = 8;
  return texture;
}

/** Soft radial contact shadow (ambient occlusion blob) for grounding character & objects. */
export function createContactShadowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(12, 14, 18, 0.85)');
  gradient.addColorStop(0.35, 'rgba(15, 18, 22, 0.65)');
  gradient.addColorStop(0.65, 'rgba(20, 24, 30, 0.32)');
  gradient.addColorStop(0.85, 'rgba(22, 26, 32, 0.1)');
  gradient.addColorStop(1, 'rgba(22, 26, 32, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

