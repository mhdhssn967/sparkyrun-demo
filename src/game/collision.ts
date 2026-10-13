import {
  LANE_WIDTH,
  PLAYER_HALF_DEPTH,
  PLAYER_HALF_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SLIDE_HEIGHT,
} from './constants';
import { OBSTACLE_PARTS } from './obstacles';
import type { Obstacle } from '../types';

/** AABB test between the player (at z = 0) and every solid part of nearby obstacles. */
export function checkCollision(
  playerX: number,
  playerY: number,
  sliding: boolean,
  obstacles: readonly Obstacle[],
  distance: number,
): boolean {
  const minY = playerY + 0.02;
  const maxY = playerY + (sliding ? PLAYER_SLIDE_HEIGHT : PLAYER_HEIGHT) - 0.02;

  for (const ob of obstacles) {
    const z = -(ob.d - distance);
    if (z < -6 || z > 6) continue;
    const cx = ob.lane * LANE_WIDTH;

    for (const part of OBSTACLE_PARTS[ob.type]) {
      if (!part.solid) continue;
      const [ox, oy, oz] = part.offset;
      const [sx, sy, sz] = part.size;
      if (Math.abs(playerX - (cx + ox)) >= PLAYER_HALF_WIDTH + sx / 2) continue;
      if (Math.abs(z + oz) >= PLAYER_HALF_DEPTH + sz / 2) continue;
      if (minY >= oy + sy / 2 || maxY <= oy - sy / 2) continue;
      return true;
    }
  }
  return false;
}
