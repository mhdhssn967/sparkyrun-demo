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

  g.fillStyle = '#41444c';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#4a4d55';
  g.fillRect(0, 0, px(-LANE_WIDTH * 1.5), h);
  g.fillRect(px(LANE_WIDTH * 1.5), 0, w, h);

  for (let i = 0; i < 2600; i++) {
    const v = 55 + Math.random() * 40;
    g.fillStyle = `rgba(${v},${v},${v + 4},0.35)`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }

  g.fillStyle = '#f2efe8';
  for (const lx of [-LANE_WIDTH / 2, LANE_WIDTH / 2]) g.fillRect(px(lx) - 3.5, 0, 7, h * 0.5);
  for (const ex of [-LANE_WIDTH * 1.5, LANE_WIDTH * 1.5]) g.fillRect(px(ex) - 3.5, 0, 7, h);

  g.fillStyle = '#8a1538';
  for (const kx of [-ROAD_HALF_WIDTH + 0.25, ROAD_HALF_WIDTH - 0.25]) g.fillRect(px(kx) - 6, 0, 12, h);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, CHUNK_LENGTH / TILE_LENGTH);
  texture.anisotropy = 8;
  return texture;
}
