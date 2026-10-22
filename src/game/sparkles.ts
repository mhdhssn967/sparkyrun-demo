export interface SparkleParticle {
  x: number;
  y: number;
  z: number;      // 3D coordinate in runner's frame (stays around z = 0, never drifts backward!)
  vx: number;
  vy: number;
  vz: number;
  life: number;   // 1.0 down to 0
  maxLife: number;
  size: number;
  rot: number;
  vRot: number;
  colorType: number; // 0 = bright diamond white, 1 = radiant 24k gold, 2 = pale star yellow
}

const MAX_SPARKLES = 64;
export const sparklePool: SparkleParticle[] = [];

/**
 * Spawns a crisp, visible star sparkle burst at the coin pickup impact point.
 * Anchored in the runner's reference frame so it expands outward in place and NEVER rushes backward.
 */
export function spawnCoinBurst(x: number, y: number, z: number = 0) {
  const count = 7; // Crisp, balanced star burst: visible and noticeable without clutter
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const speed = 1.7 + Math.random() * 1.5;
    const upwardSpeed = Math.sin(angle) * speed + 0.6;
    const horizSpeed = Math.cos(angle) * speed;
    const depthSpeed = (Math.random() - 0.5) * 0.8;

    const p: SparkleParticle = {
      x: x + (Math.random() - 0.5) * 0.12,
      y: y + 0.35 + (Math.random() - 0.5) * 0.12,
      z: z + (Math.random() - 0.5) * 0.10,
      vx: horizSpeed,
      vy: upwardSpeed,
      vz: depthSpeed,
      life: 1.0,
      maxLife: 0.30 + Math.random() * 0.08, // snappy 0.30s to 0.38s burst
      size: 0.30 + Math.random() * 0.08,    // visible (0.30m - 0.38m), clearly noticeable
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 12.0,
      colorType: i % 3,
    };

    if (sparklePool.length < MAX_SPARKLES) {
      sparklePool.push(p);
    } else {
      // Recycle the oldest active particle
      sparklePool.shift();
      sparklePool.push(p);
    }
  }
}

export const spawnCoinSparkles = spawnCoinBurst;

export function updateSparkles(dt: number) {
  for (let i = sparklePool.length - 1; i >= 0; i--) {
    const p = sparklePool[i];
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      sparklePool.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vy -= 4.5 * dt; // gentle gravity
    p.vx *= Math.exp(-3.5 * dt); // air drag slows the burst naturally
    p.vz *= Math.exp(-3.5 * dt);
    p.rot += p.vRot * dt;
  }
}

export function resetSparkles() {
  sparklePool.length = 0;
}
