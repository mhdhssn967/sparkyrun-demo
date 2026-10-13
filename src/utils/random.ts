export type Rng = () => number;

/** Small, fast, seedable PRNG (mulberry32). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (r: Rng, min: number, max: number) => min + r() * (max - min);
export const chance = (r: Rng, p: number) => r() < p;
export function pick<T>(r: Rng, items: readonly T[]): T {
  return items[Math.floor(r() * items.length) % items.length];
}
