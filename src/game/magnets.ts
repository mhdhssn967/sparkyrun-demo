import type { Lane, MagnetItem, Obstacle } from '../types';
import { createRng, pick } from '../utils/random';
import type { Rng } from '../utils/random';

const LANES: readonly Lane[] = [-1, 0, 1];

/**
 * Procedural Magnet Spawner.
 *
 * Requirements:
 * 1. Initial magnet: Appears after 40s to 60s (1 minute) of active run time.
 * 2. Subsequent magnets: Appear only after a 40s to 90s (1.5 minutes) gap.
 * 3. Never spawns while a magnet is active on the runner (runtime.magnetTimer > 0)
 *    or while an uncollected magnet is already on the track.
 */
export class MagnetSpawner {
  private rng: Rng = createRng(1337);
  private elapsedRunTime = 0;
  private nextSpawnTime = 0;
  private nextId = 1;

  reset(seed: number, _runStart = 0) {
    this.rng = createRng(seed + 9999);
    this.elapsedRunTime = 0;
    // Initial magnet appears between 40 and 60 seconds (1 minute) into the run
    this.nextSpawnTime = 40 + this.rng() * 20;
    this.nextId = 1;
  }

  update(
    dt: number,
    distance: number,
    _speed: number,
    obstacles: readonly Obstacle[],
    list: MagnetItem[],
    isMagnetActive: boolean,
  ) {
    this.elapsedRunTime += dt;

    const magnetOnTrack = list.some((m) => !m.collected);

    // If runner has an active magnet or one is already on track, defer the next spawn
    if (isMagnetActive || magnetOnTrack) {
      const minNext = this.elapsedRunTime + 40 + this.rng() * 50;
      if (this.nextSpawnTime < minNext) {
        this.nextSpawnTime = minNext;
      }
      return;
    }

    // Ready to spawn a new magnet once scheduled time is reached
    if (this.elapsedRunTime >= this.nextSpawnTime) {
      // Spawn ahead where visible in the forward view
      const spawnDistance = distance + 75;
      const spawned = this.spawnMagnet(spawnDistance, obstacles, list);

      if (spawned) {
        // Schedule next magnet 40s to 90s (1.5 minutes) into the future
        this.nextSpawnTime = this.elapsedRunTime + 40 + this.rng() * 50;
      }
    }
  }

  private spawnMagnet(baseD: number, obstacles: readonly Obstacle[], list: MagnetItem[]): boolean {
    // Check small forward offsets (0, +6, -6, +12) to find an obstacle-free lane
    for (const offset of [0, 6, -6, 12]) {
      const d = baseD + offset;
      const availableLanes = LANES.filter((l) => {
        return !obstacles.some((ob) => ob.lane === l && Math.abs(ob.d - d) < 8);
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
