import {
  DOUBLE_JUMP_VELOCITY,
  FAST_FALL_VELOCITY,
  GRAVITY,
  JUMP_VELOCITY,
  LANE_WIDTH,
  MAX_SPEED,
  SLIDE_DURATION,
  SPEED_RAMP,
  START_SPEED,
  BEND,
  FALL_STAY_DURATION,
} from './constants';
import {
  TURBO_DECEL_DURATION,
  TURBO_DURATION,
  TURBO_SPEED_MULTIPLIER,
} from './constants';
import { checkCollision } from './collision';
import { ObstacleSpawner } from './obstacles';
import { CrystalSpawner } from './crystals';
import { MagnetSpawner } from './magnets';
import { PowerupSpawner } from './powerups';
import { addCoins, getGameState, runtime, saveBest, setGameState } from './state';
import {
  playCrystalPickupSound,
  playHitSound,
  playMagnetPickupSound,
  playTurboPickupSound,
  restartBGM,
  restoreBGMVolume,
  startTurboMusic,
  stopBGM,
  stopTurboMusic,
} from './audio';
import { resetSparkles, spawnCoinBurst, updateSparkles } from './sparkles';
import type { GameAction, Lane } from '../types';
import { bendUniform } from '../utils/bendMaterial';

const spawner = new ObstacleSpawner();
const crystalSpawner = new CrystalSpawner();
const magnetSpawner = new MagnetSpawner();
const powerupSpawner = new PowerupSpawner();
let crashedAt = 0;

export function resetRunSession() {
  runtime.speed = 0;
  runtime.distance = 0;
  runtime.runStart = 0;
  runtime.vx = 0;
  runtime.x = 0;
  runtime.vy = 0;
  runtime.y = 0;
  runtime.grounded = true;
  runtime.canDoubleJump = false;
  runtime.isFlipping = false;
  runtime.flipHangTimer = 0;
  runtime.sliding = false;
  runtime.slideQueued = false;
  runtime.slideTimer = 0;
  runtime.rollCount = 0;
  runtime.crashed = false;
  runtime.fallTimer = 0;
  runtime.obstacles = [];
  runtime.crystals = [];
  runtime.magnets = [];
  runtime.powerups = [];
  runtime.luluGifts = [];
  runtime.magnetTimer = 0;
  runtime.turboTimer = 0;
  stopTurboMusic(0.05);
  resetSparkles();
  spawner.reset((Math.random() * 1e9) | 0, 0);
  crystalSpawner.reset((Math.random() * 1e9) | 0, 0);
  magnetSpawner.reset((Math.random() * 1e9) | 0, 0);
  powerupSpawner.reset((Math.random() * 1e9) | 0, 0);
  setGameState({ turboTime: 0, turboActive: false });
}

export function startGame(initialLives?: number) {
  const { status } = getGameState();
  if (runtime.crashed && status !== 'gameover') return; // prevent restart during 3-second fall
  if (status === 'playing') return;
  if (status === 'gameover' && performance.now() - crashedAt < 450) return; // avoid accidental key-mash restarts

  restartBGM();
  restoreBGMVolume();

  resetRunSession();
  runtime.speed = START_SPEED;
  const resolvedLives = typeof initialLives === 'number' ? initialLives : 3;
  setGameState({
    status: 'playing',
    score: 0,
    coins: 0,
    lives: resolvedLives,
    magnetTime: 0,
    magnetActive: false,
    turboTime: 0,
    turboActive: false,
  });
}


/** Shared entry point for keyboard, swipe (and later gamepad) input. */
export function applyAction(action: GameAction) {
  if (getGameState().status !== 'playing' || runtime.crashed || getGameState().paused) return;
  switch (action) {
    case 'left':
      runtime.targetLane = Math.max(-1, runtime.targetLane - 1) as Lane;
      break;
    case 'right':
      runtime.targetLane = Math.min(1, runtime.targetLane + 1) as Lane;
      break;
    case 'jump':
      if (runtime.grounded) {
        // Ground jump: regular single jump
        runtime.vy = JUMP_VELOCITY;
        runtime.grounded = false;
        runtime.canDoubleJump = true;
        runtime.isFlipping = false;
        runtime.flipHangTimer = 0;
        runtime.sliding = false;
        runtime.slideQueued = false;
      } else if (runtime.canDoubleJump) {
        // Mid-air second jump: dynamic upward lift into front flip (not fixed in place)
        runtime.canDoubleJump = false;
        runtime.isFlipping = true;
        runtime.vy = DOUBLE_JUMP_VELOCITY;
      }
      break;
    case 'slide':
      if (runtime.grounded) {
        runtime.sliding = true;
        runtime.slideTimer = SLIDE_DURATION;
        runtime.rollCount = (runtime.rollCount || 0) + 1;
      } else {
        runtime.vy = FAST_FALL_VELOCITY; // slam down, slide on landing
        runtime.slideQueued = true;
      }
      break;
  }
}

function crash() {
  crashedAt = performance.now();
  stopBGM();
  stopTurboMusic(0.2);
  playHitSound();
  runtime.crashed = true;
  runtime.fallTimer = FALL_STAY_DURATION;
  runtime.canDoubleJump = false;
  runtime.isFlipping = false;
  runtime.sliding = false;
  runtime.slideQueued = false;
  runtime.rollCount = 0;
  for (const c of runtime.crystals) {
    if (c.collected && !c.counted) {
      c.counted = true;
      addCoins(1);
    }
  }
  runtime.magnetTimer = 0;
  runtime.turboTimer = 0;
  const { score, best } = getGameState();
  const newBest = Math.max(score, best);
  if (newBest > best) saveBest(newBest);
  // Freeze the final score, but wait 3 seconds before transitioning to gameover
  setGameState({
    score,
    best: newBest,
    magnetTime: 0,
    magnetActive: false,
    turboTime: 0,
    turboActive: false,
  });
}

function updatePlaying(dt: number) {
  const meters = runtime.distance - runtime.runStart;
  const baseTargetSpeed = Math.min(MAX_SPEED, START_SPEED + meters * SPEED_RAMP);

  // Hyper-speed Turbo Boost: 8x speed for 8 seconds, then smooth deceleration over 2 seconds
  let speedMultiplier = 1.0;
  if (runtime.turboTimer > 0) {
    if (runtime.turboTimer > TURBO_DECEL_DURATION) {
      speedMultiplier = TURBO_SPEED_MULTIPLIER; // 8.0x
    } else {
      const p = runtime.turboTimer / TURBO_DECEL_DURATION; // 1 -> 0
      speedMultiplier = 1.0 + (TURBO_SPEED_MULTIPLIER - 1.0) * (p * p); // smooth ease-down
    }
  }

  const targetSpeed = baseTargetSpeed * speedMultiplier;
  if (runtime.turboTimer > 0) {
    runtime.speed += (targetSpeed - runtime.speed) * Math.min(1, dt * 12);
  } else {
    runtime.speed += (targetSpeed - runtime.speed) * Math.min(1, dt * 2);
  }
  runtime.distance += runtime.speed * dt;

  const targetX = runtime.targetLane * LANE_WIDTH;
  const diff = targetX - runtime.x;
  // Second-order critically damped spring: high lateral agility during turbo
  const springK = runtime.turboTimer > 0 ? 550 : 280;
  const damper = runtime.turboTimer > 0 ? 38 : 25;
  runtime.vx += (diff * springK - runtime.vx * damper) * dt;
  runtime.x += runtime.vx * dt;

  if (!runtime.grounded) {
    const effectiveGravity = Math.abs(runtime.vy) < 3.0 ? GRAVITY * 0.70 : GRAVITY;
    runtime.vy -= effectiveGravity * dt;
    runtime.y += runtime.vy * dt;
    if (runtime.y <= 0) {
      runtime.y = 0;
      runtime.vy = 0;
      runtime.grounded = true;
      runtime.canDoubleJump = false;
      runtime.isFlipping = false;
      if (runtime.slideQueued) {
        runtime.slideQueued = false;
        runtime.sliding = true;
        runtime.slideTimer = SLIDE_DURATION;
        runtime.rollCount = (runtime.rollCount || 0) + 1;
      }
    }
  }
  if (runtime.sliding) {
    runtime.slideTimer -= dt;
    if (runtime.slideTimer <= 0) runtime.sliding = false;
  }

  // Magnet power-up duration countdown (10 seconds)
  if (runtime.magnetTimer > 0) {
    runtime.magnetTimer = Math.max(0, runtime.magnetTimer - dt);
    setGameState({
      magnetTime: runtime.magnetTimer,
      magnetActive: runtime.magnetTimer > 0,
    });
  } else if (getGameState().magnetActive) {
    setGameState({ magnetTime: 0, magnetActive: false });
  }

  // Turbo power-up duration countdown (8s 8x boost + 2s deceleration = 10 seconds)
  if (runtime.turboTimer > 0) {
    const prevTurboTimer = runtime.turboTimer;
    runtime.turboTimer = Math.max(0, runtime.turboTimer - dt);
    // When 1.0s remains on turbo, initiate the 1-second fade out
    if (prevTurboTimer > 1.0 && runtime.turboTimer <= 1.0) {
      stopTurboMusic(1.0);
    }
    setGameState({
      turboTime: runtime.turboTimer,
      turboActive: runtime.turboTimer > 0,
    });
  } else if (getGameState().turboActive) {
    setGameState({ turboTime: 0, turboActive: false });
    stopTurboMusic(0.2);
  }

  spawner.update(runtime.distance, runtime.runStart, runtime.speed, runtime.obstacles);
  // recycle obstacles that are behind the camera
  const list = runtime.obstacles;
  for (let i = list.length - 1; i >= 0; i--) {
    if (-(list[i].d - runtime.distance) > 14) list.splice(i, 1);
  }

  // Update magnet power-up generation, collection, and recycling
  magnetSpawner.update(
    dt,
    runtime.distance,
    runtime.speed,
    runtime.obstacles,
    runtime.magnets,
    runtime.magnetTimer > 0,
  );
  const magnets = runtime.magnets;
  for (let i = magnets.length - 1; i >= 0; i--) {
    const m = magnets[i];
    const relZ = m.d - runtime.distance;

    if (m.collected) {
      m.collectAnim -= dt * 3.5;
      if (m.collectAnim <= 0) {
        magnets.splice(i, 1);
      }
      continue;
    }

    if (-relZ > 14) {
      magnets.splice(i, 1);
      continue;
    }

    const targetX = m.lane * LANE_WIDTH;
    const dx = Math.abs(runtime.x - targetX);
    const dy = Math.abs(runtime.y + 0.95 - m.y);
    const dz = Math.abs(relZ);

    if (dx < 1.15 && dy < 1.35 && dz < 1.25) {
      m.collected = true;
      m.collectAnim = 1.0;
      runtime.magnetTimer = 10.0;
      setGameState({ magnetTime: 10.0, magnetActive: true });
      spawnCoinBurst(targetX, m.y + 0.2, 0);
      playMagnetPickupSound();
    }
  }

  // Update turbo power-up generation, collection, and recycling
  powerupSpawner.update(
    dt,
    runtime.distance,
    runtime.speed,
    runtime.obstacles,
    runtime.powerups,
    runtime.turboTimer > 0,
  );
  const powerups = runtime.powerups;
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    const relZ = p.d - runtime.distance;

    if (p.collected) {
      p.collectAnim -= dt * 3.5;
      if (p.collectAnim <= 0) {
        powerups.splice(i, 1);
      }
      continue;
    }

    if (-relZ > 14) {
      powerups.splice(i, 1);
      continue;
    }

    const targetX = p.lane * LANE_WIDTH;
    const dx = Math.abs(runtime.x - targetX);
    const dy = Math.abs(runtime.y + 0.95 - p.y);
    const dz = Math.abs(relZ);

    if (dx < 1.35 && dy < 1.45 && dz < 1.45) {
      p.collected = true;
      p.collectAnim = 1.0;
      runtime.turboTimer = TURBO_DURATION;
      setGameState({ turboTime: TURBO_DURATION, turboActive: true });
      spawnCoinBurst(targetX, p.y + 0.2, 0);
      playTurboPickupSound();
      startTurboMusic();
    }
  }

  // Update crystal generation, collection, and recycling
  crystalSpawner.update(runtime.distance, runtime.runStart, runtime.speed, runtime.obstacles, runtime.crystals);
  const crystals = runtime.crystals;
  const isTurbo = runtime.turboTimer > 0;
  // During turbo, coins within close proximity (16m) are automatically vacuumed into the runner
  const isMagnetActive = runtime.magnetTimer > 0 || isTurbo;
  const magnetRange = isTurbo ? 16.0 : 22.0;

  for (let i = crystals.length - 1; i >= 0; i--) {
    const c = crystals[i];
    const relZ = c.d - runtime.distance;

    // Animate collected crystals (flying to HUD)
    if (c.collected) {
      c.collectAnim -= dt * 2.2;
      if (c.collectAnim <= 0) {
        if (!c.counted) {
          c.counted = true;
          addCoins(1);
        }
        crystals.splice(i, 1);
      }
      continue;
    }

    // Magnetic / Turbo coin attraction: vacuum all nearby coins towards character across all lanes
    if (!c.collected && (c.attracted || (isMagnetActive && relZ > -3.0 && relZ < magnetRange))) {
      c.attracted = true;
      if (c.pullX === undefined || c.pullY === undefined || c.pullZ === undefined) {
        c.pullX = c.lane * LANE_WIDTH;
        c.pullY = c.y;
        c.pullZ = -relZ;
      }

      const pullX = c.pullX;
      const pullY = c.pullY;
      const pullZ = c.pullZ;

      const targetX = runtime.x;
      const targetY = runtime.y + 0.9;
      const targetZ = 0;

      const dx = targetX - pullX;
      const dy = targetY - pullY;
      const dz = targetZ - pullZ;
      const dist = Math.hypot(dx, dy, dz);

      if (dist < (isTurbo ? 2.6 : 1.15) || (isTurbo && relZ < 1.4 && relZ > -2.0)) {
        c.collected = true;
        c.collectAnim = 1.0;
        c.counted = false;
        c.pickupX = pullX;
        c.pickupY = pullY;
        c.pickupZ = pullZ;
        c.currentX = pullX;
        c.currentY = pullY;
        c.currentZ = pullZ;
        spawnCoinBurst(pullX, pullY, 0);
        playCrystalPickupSound();
        continue;
      } else {
        const pullSpeed = isTurbo
          ? 180.0
          : (22.0 + Math.max(0, (1.0 - dist / 22.0)) * 24.0);
        c.pullX = pullX + (dx / dist) * pullSpeed * dt;
        c.pullY = pullY + (dy / dist) * pullSpeed * dt;
        c.pullZ = pullZ + (dz / dist) * pullSpeed * dt;
        c.currentX = c.pullX;
        c.currentY = c.pullY;
        c.currentZ = c.pullZ;
        continue;
      }
    }

    // Recycle uncollected crystals that fell behind
    if (-relZ > 14) {
      crystals.splice(i, 1);
      continue;
    }

    // Check collection overlap with runner
    const targetX = c.lane * LANE_WIDTH;
    const dx = Math.abs(runtime.x - targetX);
    const dy = Math.abs(runtime.y + 0.95 - c.y);
    const dz = Math.abs(relZ);

    if (dx < 1.05 && dy < 1.25 && dz < 1.15) {
      c.collected = true;
      c.collectAnim = 1.0;
      c.counted = false;
      c.pickupX = targetX;
      c.pickupY = c.y;
      c.pickupZ = -(c.d - runtime.distance);
      c.currentX = c.pickupX;
      c.currentY = c.pickupY;
      c.currentZ = c.pickupZ;
      spawnCoinBurst(targetX, c.y, 0);
      playCrystalPickupSound();
    }
  }

  // Obstacle collision check: character is 100% immune during turbo boost!
  if (checkCollision(runtime.x, runtime.y, runtime.sliding, list, runtime.distance)) {
    if (runtime.turboTimer <= 0) {
      crash();
      return;
    }
  }

  const score = Math.floor(runtime.distance - runtime.runStart);
  if (score !== getGameState().score) setGameState({ score });
}

function updateBend() {
  const d = runtime.distance;
  bendUniform.value.set(
    BEND.x * (0.65 * Math.sin(d * 0.006) + 0.35 * Math.sin(d * 0.0017 + 1.7)),
    BEND.yBase + BEND.yVar * Math.sin(d * 0.0029 + 0.6),
  );
}

/** Advance the whole simulation by dt seconds. Called once per frame from <GameLoop />. */
export function stepFrame(dt: number) {
  if (getGameState().paused) return;
  runtime.time += dt;
  updateSparkles(dt);
  const { status } = getGameState();

  if (status === 'playing') {
    if (runtime.crashed) {
      // Fall execution & 3-second hold: decelerate rapidly to halt at collision point
      runtime.speed *= Math.exp(-12 * dt);
      runtime.distance += runtime.speed * dt;
      runtime.vx *= Math.exp(-14 * dt);
      runtime.x += runtime.vx * dt;

      // Bring character down to ground if crash happened mid-air
      if (!runtime.grounded) {
        runtime.vy -= GRAVITY * dt;
        runtime.y += runtime.vy * dt;
        if (runtime.y <= 0) {
          runtime.y = 0;
          runtime.vy = 0;
          runtime.grounded = true;
        }
      }

      // Countdown the 3 seconds while character stays fallen on the road
      runtime.fallTimer -= dt;
      if (runtime.fallTimer <= 0) {
        stopBGM();
        const { coins, best } = getGameState();
        setGameState({ status: 'gameover', best: Math.max(coins, best) });
      }
    } else {
      updatePlaying(dt);
    }
  } else if (status === 'menu' || status === 'home') {
    // Stand still on the road before starting
    runtime.speed = 0;
    runtime.distance = 0;
    runtime.runStart = 0;
    runtime.vx = 0;
    runtime.x = 0;
    runtime.vy = 0;
    runtime.y = 0;
    runtime.grounded = true;
    runtime.sliding = false;
    runtime.crashed = false;
    runtime.fallTimer = 0;
    if (runtime.crystals.length > 0) runtime.crystals = [];
    if (runtime.magnets.length > 0) runtime.magnets = [];
    if (runtime.powerups.length > 0) runtime.powerups = [];
    if (runtime.obstacles.length > 0) runtime.obstacles = [];
    runtime.magnetTimer = 0;
    runtime.turboTimer = 0;
  } else {
    // status === 'gameover': character remains motionless in fallen pose
    runtime.speed = 0;
    runtime.vx = 0;
  }
  updateBend();
}
