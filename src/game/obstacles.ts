import { COLORS, FIRST_OBSTACLE_DISTANCE, LANE_WIDTH, SPAWN_AHEAD } from './constants';
import type { BoxPart, ColorRole, Lane, Obstacle, ObstacleType } from '../types';
import { createRng, pick } from '../utils/random';
import type { Rng } from '../utils/random';

/**
 * Single source of truth for obstacle shapes: used both for rendering and for collision.
 * Offsets are relative to the lane centre / obstacle centre, sizes are full extents.
 */
export const OBSTACLE_PARTS: Record<ObstacleType, readonly BoxPart[]> = {
  // Jersey barrier – jump over it
  low: [
    { offset: [0, 0.4, 0], size: [2.3, 0.8, 0.7], role: 'primary', solid: true },
    { offset: [0, 0.85, 0], size: [2.3, 0.12, 0.8], role: 'secondary', solid: true },
  ],
  // Road-sign gantry – slide under it
  overhead: [
    { offset: [-1.2, 1.25, 0], size: [0.25, 2.5, 0.4], role: 'secondary', solid: true },
    { offset: [1.2, 1.25, 0], size: [0.25, 2.5, 0.4], role: 'secondary', solid: true },
    { offset: [0, 1.825, 0], size: [2.5, 1.35, 0.35], role: 'primary', solid: true },
    { offset: [0, 1.35, 0.2], size: [2.3, 0.1, 0.05], role: 'secondary', solid: false },
  ],
  // Parked car / bus – change lane
  wall: [
    { offset: [0, 0.2, 0], size: [1.95, 0.4, 3.4], role: 'dark', solid: true },
    { offset: [0, 0.85, 0], size: [1.9, 0.9, 4.0], role: 'primary', solid: true },
    { offset: [0, 1.55, 0.2], size: [1.7, 0.8, 2.2], role: 'dark', solid: true },
  ],
};

const SCHEMES: Record<ObstacleType, readonly (readonly [number, number])[]> = {
  low: [[COLORS.maroon, COLORS.white], [COLORS.white, COLORS.maroon], [COLORS.sandLight, COLORS.maroon]],
  overhead: [[COLORS.maroon, COLORS.white], [COLORS.white, COLORS.maroonDark]],
  wall: [
    [COLORS.white, COLORS.white],
    [COLORS.maroon, COLORS.white],
    [COLORS.turquoise, COLORS.white], // Karwa-style taxi
    [COLORS.charcoal, COLORS.white],
  ],
};

export function obstacleColor(type: ObstacleType, variant: number, role: ColorRole): number {
  if (role === 'dark') return COLORS.charcoal;
  const scheme = SCHEMES[type][variant % SCHEMES[type].length];
  return role === 'primary' ? scheme[0] : scheme[1];
}

const LANES: readonly Lane[] = [-1, 0, 1];

/** Deterministic procedural obstacle generator – always leaves a passable route. */
export class ObstacleSpawner {
  private rng: Rng = createRng(1);
  private nextD = 0;
  private nextId = 1;

  reset(seed: number, runStart: number) {
    this.rng = createRng(seed);
    this.nextD = runStart + FIRST_OBSTACLE_DISTANCE;
  }

  update(distance: number, runStart: number, speed: number, list: Obstacle[]) {
    const horizon = distance + SPAWN_AHEAD;
    while (this.nextD < horizon) {
      this.spawnRow(this.nextD, distance - runStart, list);
      // gap scales with speed so reaction time stays roughly constant
      this.nextD += Math.max(22, (speed + 6) * 1.15) + this.rng() * 9;
    }
  }

  private add(list: Obstacle[], type: ObstacleType, lane: Lane, d: number) {
    list.push({ id: this.nextId++, type, lane, d, variant: Math.floor(this.rng() * 8) });
  }

  private spawnRow(d: number, meters: number, list: Obstacle[]) {
    const r = this.rng;
    const hard = Math.min(1, meters / 2500);
    const roll = r();
    const lane = pick(r, LANES);

    if (meters < 150 || roll < 0.34 - hard * 0.1) {
      // single obstacle: jump barrier or overhead gantry
      this.add(list, pick(r, ['low', 'overhead'] as const), lane, d);
    } else if (roll < 0.66) {
      // two lanes blocked, one open
      const open = pick(r, LANES);
      for (const l of LANES) {
        if (l === open) continue;
        this.add(list, r() < 0.5 ? 'low' : 'overhead', l, d);
      }
    } else if (roll < 0.85) {
      for (const l of LANES) this.add(list, 'low', l, d); // jump row
    } else {
      for (const l of LANES) this.add(list, 'overhead', l, d); // slide row
    }
  }
}

export const laneToX = (lane: Lane) => lane * LANE_WIDTH;
