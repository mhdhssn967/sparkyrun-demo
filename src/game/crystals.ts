import { SPAWN_AHEAD } from './constants';
import type { Crystal, Lane, Obstacle } from '../types';
import { createRng, pick } from '../utils/random';
import type { Rng } from '../utils/random';

const LANES: readonly Lane[] = [-1, 0, 1];
const FIRST_CRYSTAL_DISTANCE = 22;

export class CrystalSpawner {
  private rng: Rng = createRng(42);
  private nextD = 0;
  private nextId = 1;
  private spawnedObstacleIds = new Set<number>();

  reset(seed: number, runStart: number) {
    this.rng = createRng(seed + 777);
    this.nextD = runStart + FIRST_CRYSTAL_DISTANCE;
    this.nextId = 1;
    this.spawnedObstacleIds.clear();
  }

  update(
    distance: number,
    _runStart: number,
    _speed: number,
    obstacles: readonly Obstacle[],
    list: Crystal[],
  ) {
    const horizon = distance + SPAWN_AHEAD;

    // 1. Check upcoming obstacles to spawn matching jump arcs and slide lines
    for (const ob of obstacles) {
      if (ob.d > horizon || this.spawnedObstacleIds.has(ob.id)) continue;
      this.spawnedObstacleIds.add(ob.id);

      if (ob.type === 'low') {
        // Balanced 5-coin jump arc over hurdle matched to character leap path
        const offsets: readonly [number, number][] = [
          [-4.4, 1.80],
          [-2.2, 2.90],
          [0.0, 3.55],
          [2.2, 2.90],
          [4.4, 1.80],
        ];
        for (const [dz, y] of offsets) {
          list.push({
            id: this.nextId++,
            lane: ob.lane,
            d: ob.d + dz,
            y,
            collected: false,
            collectAnim: 0,
          });
        }
      } else if (ob.type === 'overhead') {
        // Slide trail under the sign gantry (3 low crystals)
        const offsets: readonly number[] = [-3.0, 0.0, 3.0];
        for (const dz of offsets) {
          list.push({
            id: this.nextId++,
            lane: ob.lane,
            d: ob.d + dz,
            y: 0.65,
            collected: false,
            collectAnim: 0,
          });
        }
      }
    }

    // 2. Procedural crystal lines in open track stretches with wider gaps
    while (this.nextD < horizon) {
      this.spawnLine(this.nextD, obstacles, list);
      this.nextD += 26 + this.rng() * 16;
    }
  }

  private spawnLine(d: number, obstacles: readonly Obstacle[], list: Crystal[]) {
    // Find lanes that don't have obstacles right here
    const availableLanes = LANES.filter((l) => {
      return !obstacles.some((ob) => ob.lane === l && Math.abs(ob.d - d) < 9);
    });

    if (availableLanes.length === 0) return;
    const lane = pick(this.rng, availableLanes);
    const count = 3 + Math.floor(this.rng() * 3); // 3 to 5 crystals in trail

    for (let i = 0; i < count; i++) {
      list.push({
        id: this.nextId++,
        lane,
        d: d + i * 2.9,
        y: 1.05,
        collected: false,
        collectAnim: 0,
      });
    }
  }
}
