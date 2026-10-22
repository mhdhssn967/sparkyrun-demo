import type { Lane, Obstacle, PowerupItem } from '../types';
import { createRng, pick } from '../utils/random';
import type { Rng } from '../utils/random';

const LANES: readonly Lane[] = [-1, 0, 1];

/**
 * Procedural Powerup (Turbo Lightning) Spawner.
 *
 * Requirements:
 * 1. Initial spawn: Appears only after 1 minute (60s - 75s) of active gameplay.
 * 2. Subsequent spawns: Random intervals of 1 to 2 minutes (60s to 120s).
 * 3. Never spawns while turbo is active or while a power-up is uncollected on track.
 */
export class PowerupSpawner {
  private rng: Rng = createRng(9021);
  private elapsedRunTime = 0;
  private nextSpawnTime = 0;
  private nextId = 1;

  reset(seed: number, _runStart = 0) {
    this.rng = createRng(seed + 8888);
    this.elapsedRunTime = 0;
    // Initial power-up scheduled after 1 minute of active running (60 to 75 seconds)
    this.nextSpawnTime = 60 + this.rng() * 15;
    this.nextId = 1;
  }

  update(
    dt: number,
    distance: number,
    _speed: number,
    obstacles: readonly Obstacle[],
    list: PowerupItem[],
    isTurboActive: boolean,
  ) {
    this.elapsedRunTime += dt;

    const powerupOnTrack = list.some((p) => !p.collected);

    // If runner is currently powered up or a power-up is already on the track, defer next spawn
    if (isTurboActive || powerupOnTrack) {
      const minNext = this.elapsedRunTime + 60 + this.rng() * 60;
      if (this.nextSpawnTime < minNext) {
        this.nextSpawnTime = minNext;
      }
      return;
    }

    // Ready to spawn when scheduled time arrives (1+ minute on first spawn, then 1-2 min intervals)
    if (this.elapsedRunTime >= this.nextSpawnTime) {
      const spawnDistance = distance + 80;
      const spawned = this.spawnPowerup(spawnDistance, obstacles, list);
      if (spawned) {
        // Subsequent intervals of 1 to 2 minutes randomly (60s to 120s)
        this.nextSpawnTime = this.elapsedRunTime + 60 + this.rng() * 60;
      }
    }
  }

  private spawnPowerup(baseD: number, obstacles: readonly Obstacle[], list: PowerupItem[]): boolean {
    for (const offset of [0, 8, -8, 14]) {
      const d = baseD + offset;
      const availableLanes = LANES.filter((l) => {
        return !obstacles.some((ob) => ob.lane === l && Math.abs(ob.d - d) < 9);
      });

      if (availableLanes.length > 0) {
        const lane = pick(this.rng, availableLanes);
        list.push({
          id: this.nextId++,
          lane,
          d,
          y: 1.15,
          collected: false,
          collectAnim: 0,
        });
        return true;
      }
    }
    return false;
  }
}
