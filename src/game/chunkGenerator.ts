import { BANNER_A_ASPECT, BANNER_B_ASPECT, CHUNK_LENGTH as L, COLORS, ROAD_HALF_WIDTH } from './constants';
import type { BannerInstance, BannerKind, ChunkInstance, ChunkOutput, InstanceKind } from '../types';
import { chance, createRng, pick, range } from '../utils/random';
import type { Rng } from '../utils/random';

type Out = ChunkInstance[];
type Banners = BannerInstance[];

/** Chunk-local space: x across the road, z from 0 (near end) to -CHUNK_LENGTH (far end). */
function add(
  out: Out,
  kind: InstanceKind,
  x: number,
  baseY: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: number,
  rotation?: readonly [number, number, number],
) {
  out.push({ kind, position: [x, baseY + h / 2, z], scale: [w, h, d], color, rotation });
}

function addCenter(
  out: Out,
  kind: InstanceKind,
  x: number,
  centerY: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: number,
  rotation?: readonly [number, number, number],
) {
  out.push({ kind, position: [x, centerY, z], scale: [w, h, d], color, rotation });
}

const box = (o: Out, x: number, y: number, z: number, w: number, h: number, d: number, c: number) => add(o, 'box', x, y, z, w, h, d, c);
const cyl = (o: Out, x: number, y: number, z: number, dia: number, h: number, c: number) => add(o, 'cylinder', x, y, z, dia, h, dia, c);
const cone = (o: Out, x: number, y: number, z: number, dia: number, h: number, c: number) => add(o, 'cone', x, y, z, dia, h, dia, c);
const sphere = (o: Out, x: number, y: number, z: number, w: number, h: number, d: number, c: number) => add(o, 'sphere', x, y, z, w, h, d, c);

const GLASS = [0x6ba4d4, 0x80b6e0, 0x5d9ecf, 0x94c8e6, 0x72add6, 0xa2cde7];
const SAND = [COLORS.sand, COLORS.sandLight, 0xdfbe8c, 0xfae2be];

/** Adds a framed billboard/banner preserving the exact aspect ratio of the underlying source image. */
function addFramedBanner(
  out: Out,
  banners: Banners,
  kind: BannerKind,
  x: number,
  y: number,
  z: number,
  h: number,
  ry: number = 0,
  options?: {
    catwalk?: boolean;
    lamps?: number;
    depth?: number;
  },
) {
  const aspect = kind === 'bannerA' ? BANNER_A_ASPECT : BANNER_B_ASPECT;
  const w = h * aspect;
  const rot: readonly [number, number, number] = [0, ry, 0];
  const nx = Math.sin(ry);
  const nz = Math.cos(ry);
  const tx = Math.cos(ry);
  const tz = -Math.sin(ry);
  const depth = options?.depth ?? 0.16;

  // Frame backing board
  addCenter(out, 'box', x, y, z, w + 0.3, h + 0.24, depth, COLORS.charcoal, rot);

  // Service catwalk at bottom
  if (options?.catwalk) {
    const cwY = y - h / 2 - 0.1;
    const cwX = x + nx * (depth / 2 + 0.18);
    const cwZ = z + nz * (depth / 2 + 0.18);
    addCenter(out, 'box', cwX, cwY, cwZ, w + 0.4, 0.12, 0.42, COLORS.charcoal, rot);
  }

  // Overhead illumination lamps
  const lampCount = options?.lamps ?? 0;
  if (lampCount > 0) {
    const lampY = y + h / 2 + 0.18;
    for (let i = 0; i < lampCount; i++) {
      const frac = lampCount === 1 ? 0 : -0.32 + (0.64 / (lampCount - 1)) * i;
      const ox = tx * (frac * w);
      const oz = tz * (frac * w);
      addCenter(out, 'box', x + ox + nx * 0.14, lampY, z + oz + nz * 0.14, 0.18, 0.1, 0.36, COLORS.charcoal, rot);
      addCenter(out, 'lamp', x + ox + nx * 0.22, lampY - 0.04, z + oz + nz * 0.22, 0.14, 0.08, 0.14, 0xffe2a8, rot);
    }
  }

  // Textured Banner Quad
  const quadOffset = depth / 2 + 0.04;
  banners.push({
    kind,
    position: [x + nx * quadOffset, y, z + nz * quadOffset],
    rotation: rot,
    scale: [w, h, 1],
  });

  return { w, h, rot, nx, nz, tx, tz };
}

// ---- Hoardings & Banners ----------------------------------------------------

function roadsideHoarding(out: Out, banners: Banners, r: Rng, s: number, z: number) {
  const isBannerA = chance(r, 0.5);
  const x = s * range(r, 8.6, 9.8);
  // Angle inward towards oncoming runner
  const ry = -s * range(r, 0.14, 0.26);

  if (isBannerA) {
    // Massive Unipole Billboard (Banner A - 329x263, aspect ~1.25095)
    const h = range(r, 4.8, 6.2);
    const y = range(r, 6.8, 8.2);
    const poleH = y - h / 2;

    // Heavy round steel pillar
    cyl(out, x, 0, z, 0.48, poleH, COLORS.charcoal);

    addFramedBanner(out, banners, 'bannerA', x, y, z, h, ry, { catwalk: true, lamps: 2 });
  } else {
    // Massive Wide Highway Billboard (Banner B - 800x199, aspect ~4.0201)
    const h = range(r, 2.7, 3.6);
    const w = h * BANNER_B_ASPECT;
    const y = range(r, 6.4, 7.8);
    const poleH = y - h / 2;

    // Twin structural steel support columns
    const tx = Math.cos(ry);
    const tz = -Math.sin(ry);
    const colOffset = w * 0.28;
    cyl(out, x - tx * colOffset, 0, z - tz * colOffset, 0.32, poleH, COLORS.charcoal);
    cyl(out, x + tx * colOffset, 0, z + tz * colOffset, 0.32, poleH, COLORS.charcoal);

    addFramedBanner(out, banners, 'bannerB', x, y, z, h, ry, { catwalk: true, lamps: 3 });
  }
}

// ---- Street furniture ------------------------------------------------------

function roadside(out: Out, banners: Banners, r: Rng) {
  const edge = ROAD_HALF_WIDTH + 0.25;
  for (const s of [-1, 1]) {
    // sidewalk slabs (short pieces so the world bend stays smooth along them)
    for (let i = 0; i < L / 5; i++) {
      box(out, s * (edge + 2.6), 0, -(i * 5 + 2.5), 4.6, 0.22, 5, COLORS.stone);
    }
    // maroon / white jersey barriers
    for (let i = 0; i < L / 3; i++) {
      box(out, s * edge, 0, -(i * 3 + 1.5), 0.5, 0.6, 2.8, i % 2 === 0 ? COLORS.maroon : COLORS.white);
    }
    // street lights
    for (let i = 0; i < 4; i++) {
      const z = -(7.5 + i * 15);
      const x = s * (edge + 1.0);
      cyl(out, x, 0, z, 0.2, 6.6, COLORS.charcoal);
      box(out, x - s * 0.85, 6.5, z, 1.7, 0.12, 0.14, COLORS.charcoal);
      add(out, 'lamp', x - s * 1.6, 6.3, z, 0.7, 0.14, 0.34, 0xffe2a8);
    }
    // palms
    for (let i = 0; i < 5; i++) {
      const z = -(4 + i * 12 + range(r, -1.5, 1.5));
      const x = s * (edge + 3.9 + range(r, -0.4, 0.4));
      const h = range(r, 4, 5.8);
      cyl(out, x, 0, z, 0.38, h, COLORS.trunk);
      sphere(out, x, h - 0.1, z, 3.0, 0.8, 3.0, COLORS.palm);
      sphere(out, x + range(r, -0.3, 0.3), h + 0.25, z, 1.9, 0.6, 1.9, COLORS.palmLight);
    }
    // Roadside hoardings / billboards (halved amount)
    for (const zc of [18, 42]) {
      if (chance(r, 0.45)) {
        roadsideHoarding(out, banners, r, s, -zc + range(r, -2.5, 2.5));
      }
    }
  }
}

// ---- Buildings -------------------------------------------------------------

function modernTower(out: Out, banners: Banners, r: Rng, s: number, x: number, z: number, w: number, d: number, h: number) {
  const glass = pick(r, GLASS);
  const podW = w * 1.25;
  const podD = d * 1.25;
  box(out, x, 0, z, podW, 4, podD, COLORS.stone); // podium
  box(out, x, 4, z, w, h, d, glass);
  if (chance(r, 0.5)) box(out, x, 4 + h, z, w * 0.65, h * 0.14, d * 0.65, glass); // setback
  const bandY = 4 + h * range(r, 0.45, 0.8);
  if (chance(r, 0.6)) box(out, x, bandY, z, w * 1.04, 1.1, d * 1.04, COLORS.maroon);
  if (chance(r, 0.4)) box(out, x, bandY + 2.6, z, w * 1.04, 0.5, d * 1.04, COLORS.white);
  if (chance(r, 0.4)) cyl(out, x, 4 + h, z, 0.35, 7, COLORS.charcoal); // antenna

  // Building Banners / Mega-Hoardings on Modern Towers (halved amount)
  // 1. Facade LED Display (Banner A or Banner B)
  if (chance(r, 0.4)) {
    if (chance(r, 0.55)) {
      // Skyscraper Facade LED Display (Banner A - 329x263, aspect ~1.25095)
      const bh = range(r, 7.5, 11.5);
      const by = 4 + range(r, 4.0, Math.min(18, Math.max(5, h - bh - 2)));
      const ry = -s * range(r, 0.22, 0.34);
      const bx = x - s * (w * 0.22);
      const bz = z + d / 2 + 0.25;
      addFramedBanner(out, banners, 'bannerA', bx, by, bz, bh, ry, { lamps: 3, depth: 0.22 });
    } else {
      // Wide Commercial Podium Banner (Banner B - 800x199, aspect ~4.0201)
      const bh = range(r, 2.7, 3.6);
      const by = 2.4;
      const ry = -s * range(r, 0.12, 0.22);
      const bx = x - s * (podW * 0.14);
      const bz = z + podD / 2 + 0.22;
      addFramedBanner(out, banners, 'bannerB', bx, by, bz, bh, ry, { catwalk: true, lamps: 3 });
    }
  }

  // 2. Rooftop Illuminated Hoarding on mid-rises
  if (h <= 36 && chance(r, 0.28)) {
    const bh = range(r, 2.6, 3.4);
    const bw = bh * BANNER_B_ASPECT;
    const by = 4 + h + bh / 2 + 0.8;
    const ry = -s * 0.2;
    const bx = x - s * (w * 0.12);
    const bz = z + d / 4;
    const tx = Math.cos(ry);
    const tz = -Math.sin(ry);
    const legOffset = bw * 0.28;
    cyl(out, bx - tx * legOffset, 4 + h, bz - tz * legOffset, 0.26, bh / 2 + 0.8, COLORS.charcoal);
    cyl(out, bx + tx * legOffset, 4 + h, bz + tz * legOffset, 0.26, bh / 2 + 0.8, COLORS.charcoal);
    addFramedBanner(out, banners, 'bannerB', bx, by, bz, bh, ry, { lamps: 3 });
  }
}

function roundTower(out: Out, banners: Banners, r: Rng, s: number, x: number, z: number, dia: number, h: number) {
  const glass = pick(r, GLASS);
  cyl(out, x, 0, z, dia, h, glass);
  const rings = 5;
  for (let i = 1; i <= rings; i++) cyl(out, x, (h / (rings + 1)) * i, z, dia * 1.06, 0.55, i % 2 ? COLORS.white : COLORS.maroon);
  cyl(out, x, h, z, dia * 1.08, 1.2, COLORS.maroon);
  if (chance(r, 0.5)) cone(out, x, h + 1.2, z, dia * 0.5, 7, COLORS.white);

  // Large-scale building banners on round tower (halved amount)
  if (chance(r, 0.38)) {
    if (chance(r, 0.5)) {
      // Cantilever Facade LED Screen (Banner A)
      const bh = range(r, 6.0, 8.5);
      const by = range(r, 7.0, Math.min(20, Math.max(8, h - bh)));
      const ry = -s * 0.3;
      const bx = x - s * (dia * 0.26);
      const bz = z + dia * 0.44;
      // Structural connector struts to the curved glass wall
      box(out, bx, by, bz - 0.4, 0.35, 0.35, 0.8, COLORS.charcoal);
      addFramedBanner(out, banners, 'bannerA', bx, by, bz, bh, ry, { lamps: 2 });
    } else {
      // Panoramic Street Billboard on Round Tower (Banner B)
      const bh = range(r, 2.6, 3.4);
      const by = range(r, 5.0, Math.min(16, Math.max(6, h - bh)));
      const ry = -s * 0.22;
      const bx = x - s * (dia * 0.2);
      const bz = z + dia * 0.45;
      box(out, bx, by, bz - 0.4, 0.35, 0.35, 0.8, COLORS.charcoal);
      addFramedBanner(out, banners, 'bannerB', bx, by, bz, bh, ry, { catwalk: true, lamps: 3 });
    }
  }
}

/** Aspire-style torch landmark. */
function torchTower(out: Out, x: number, z: number, h: number) {
  cyl(out, x, 0, z, 6.5, h * 0.78, 0xcfd6dc);
  cyl(out, x, h * 0.78, z, 3.2, h * 0.14, 0xb8c2cb);
  sphere(out, x, h * 0.86, z, 11, 17, 11, COLORS.white);
  cyl(out, x, h * 0.55, z, 7, 1, COLORS.maroon);
}

function traditionalHouse(out: Out, banners: Banners, r: Rng, s: number, x: number, z: number, w: number, d: number, h: number) {
  const wall = pick(r, SAND);
  box(out, x, 0, z, w, h, d, wall);
  box(out, x, h, z, w + 0.4, 0.55, d + 0.4, COLORS.sandLight); // parapet
  box(out, x, h - 1.0, z, w + 0.06, 0.35, d + 0.06, COLORS.maroon); // maroon band
  const doorZ = z + d / 2 + 0.05;
  box(out, x, 0, doorZ, 1.8, 2.6, 0.2, COLORS.sandDark); // door
  if (chance(r, 0.55)) {
    // barjeel wind tower
    const tx = x + w * 0.28;
    box(out, tx, h, z, 1.7, h * 0.55, 1.7, wall);
    box(out, tx, h + h * 0.55, z, 2.0, 0.4, 2.0, COLORS.sandDark);
    box(out, tx, h + h * 0.38, z, 1.75, 0.9, 1.75, COLORS.sandDark);
  }
  if (chance(r, 0.3)) sphere(out, x - w * 0.15, h + 0.2, z, Math.min(w, d) * 0.55, Math.min(w, d) * 0.4, Math.min(w, d) * 0.55, COLORS.white);

  // Large-scale commercial billboards on traditional buildings (halved amount)
  if (chance(r, 0.4)) {
    const roll = r();
    const frontZ = z + d / 2;
    if (roll < 0.4) {
      // Giant Commercial Wall Board (Banner A)
      const bh = range(r, 3.8, 5.2);
      const by = range(r, 3.2, Math.min(6.2, h - bh / 2 + 0.6));
      const ry = -s * range(r, 0.16, 0.28);
      const bx = x - s * (w * 0.2);
      const bz = frontZ + 0.22;
      addFramedBanner(out, banners, 'bannerA', bx, by, bz, bh, ry, { lamps: 2 });
    } else if (roll < 0.72) {
      // Panoramic Street Banner (Banner B)
      const bh = range(r, 2.2, 3.0);
      const by = range(r, 3.2, Math.min(6.8, h - bh / 2 + 0.5));
      const ry = -s * range(r, 0.14, 0.24);
      const bx = x - s * (w * 0.14);
      const bz = frontZ + 0.22;
      addFramedBanner(out, banners, 'bannerB', bx, by, bz, bh, ry, { catwalk: true, lamps: 3 });
    } else {
      // Rooftop Structural Truss Billboard (Banner B)
      const bh = range(r, 2.6, 3.4);
      const bw = bh * BANNER_B_ASPECT;
      const by = h + bh / 2 + 0.8;
      const ry = -s * range(r, 0.15, 0.25);
      const bx = x - s * (w * 0.12);
      const bz = frontZ - 0.2;
      const tx = Math.cos(ry);
      const tz = -Math.sin(ry);
      const legOffset = bw * 0.28;
      cyl(out, bx - tx * legOffset, h, bz - tz * legOffset, 0.22, bh / 2 + 0.8, COLORS.charcoal);
      cyl(out, bx + tx * legOffset, h, bz + tz * legOffset, 0.22, bh / 2 + 0.8, COLORS.charcoal);
      addFramedBanner(out, banners, 'bannerB', bx, by, bz, bh, ry, { catwalk: true, lamps: 3 });
    }
  }
}

function mosque(out: Out, r: Rng, x: number, z: number) {
  const w = 14;
  const d = 15;
  box(out, x, 0, z, w, 7, d, COLORS.white);
  box(out, x, 7, z, w + 0.4, 0.5, d + 0.4, COLORS.sandLight);
  box(out, x, 5.2, z, w + 0.08, 0.5, d + 0.08, COLORS.maroon);
  sphere(out, x, 6.7, z, 9, 7, 9, chance(r, 0.5) ? COLORS.white : COLORS.turquoise);
  sphere(out, x, 13.1, z, 0.7, 1.4, 0.7, COLORS.gold);
  for (const sx of [-1, 1]) {
    const mx = x + sx * (w / 2 + 1.4);
    cyl(out, mx, 0, z - d * 0.3, 1.5, 17, COLORS.white);
    cyl(out, mx, 12, z - d * 0.3, 1.9, 0.6, COLORS.maroon);
    cyl(out, mx, 17, z - d * 0.3, 2.1, 0.5, COLORS.sandLight);
    cone(out, mx, 17.5, z - d * 0.3, 1.9, 4.2, COLORS.white);
  }
}

function nearLayer(out: Out, banners: Banners, r: Rng, s: number) {
  for (const zc of [10, 30, 50]) {
    const z = -zc + range(r, -2, 2);
    const roll = r();
    if (roll < 0.34) {
      const w = range(r, 8, 12);
      const d = range(r, 8, 12);
      modernTower(out, banners, r, s, s * (15 + w * 0.65), z, w, d, range(r, 22, 48));
    } else if (roll < 0.5) {
      const dia = range(r, 8, 11);
      roundTower(out, banners, r, s, s * (15 + dia * 0.6), z, dia, range(r, 26, 52));
    } else if (roll < 0.82) {
      const w = range(r, 10, 16);
      const d = range(r, 10, 15);
      traditionalHouse(out, banners, r, s, s * (15 + w * 0.6), z, w, d, range(r, 6, 12));
    } else if (roll < 0.92) {
      mosque(out, r, s * 24, z);
    } // else: open plaza – desert scrub only
    for (let i = 0; i < 2; i++) {
      const sx = s * range(r, 11.5, 14);
      sphere(out, sx, 0, -zc + range(r, -8, 8), range(r, 1, 1.8), 0.9, range(r, 1, 1.8), COLORS.palm);
    }
  }
}

function farLayer(out: Out, r: Rng, s: number) {
  for (const zc of [15, 45]) {
    const z = -zc + range(r, -4, 4);
    const roll = r();
    const x = s * range(r, 42, 56);
    if (roll < 0.1) torchTower(out, x, z, range(r, 85, 105));
    else if (roll < 0.55) modernTower(out, [], r, s, x, z, range(r, 12, 18), range(r, 12, 18), range(r, 45, 95));
    else if (roll < 0.85) roundTower(out, [], r, s, x, z, range(r, 12, 16), range(r, 50, 90));
    else traditionalHouse(out, [], r, s, x, z, range(r, 14, 22), range(r, 12, 18), range(r, 8, 14));
  }
}

function dunes(out: Out, r: Rng, s: number) {
  if (!chance(r, 0.6)) return;
  const w = range(r, 60, 110);
  sphere(out, s * range(r, 85, 130), -4, -range(r, 8, 52), w, range(r, 14, 22), range(r, 50, 80), pick(r, [COLORS.sand, COLORS.sandDark, COLORS.sandLight]));
}

/** Pure + deterministic: the same chunk index always yields the same scenery. */
export function generateChunk(index: number): ChunkOutput {
  const r = createRng((index + 1000) * 7919 + 13);
  const out: Out = [];
  const banners: Banners = [];
  roadside(out, banners, r);
  for (const s of [-1, 1]) {
    nearLayer(out, banners, r, s);
    farLayer(out, r, s);
    dunes(out, r, s);
  }
  return { instances: out, banners };
}

