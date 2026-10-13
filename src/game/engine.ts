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
import { checkCollision } from './collision';
import { ObstacleSpawner } from './obstacles';
import { getGameState, runtime, saveBest, setGameState } from './state';
import type { GameAction, Lane } from '../types';
import { bendUniform } from '../utils/bendMaterial';

const spawner = new ObstacleSpawner();
let crashedAt = 0;

export function startGame() {
  const { status } = getGameState();
  if (runtime.crashed && status !== 'gameover') return; // prevent restart during 3-second fall
  if (status === 'playing') return;
  if (status === 'gameover' && performance.now() - crashedAt < 450) return; // avoid accidental key-mash restarts
  runtime.runStart = runtime.distance;
  runtime.speed = START_SPEED;
  runtime.x = 0;
  runtime.vx = 0;
  runtime.targetLane = 0;
  runtime.y = 0;
  runtime.vy = 0;
  runtime.grounded = true;
  runtime.canDoubleJump = false;
  runtime.isFlipping = false;
  runtime.flipHangTimer = 0;
  runtime.sliding = false;
  runtime.slideQueued = false;
  runtime.slideTimer = 0;
  runtime.crashed = false;
  runtime.fallTimer = 0;
  runtime.obstacles = [];
  spawner.reset((Math.random() * 1e9) | 0, runtime.runStart);
  setGameState({ status: 'playing', score: 0 });
}

/** Shared entry point for keyboard, swipe (and later gamepad) input. */
export function applyAction(action: GameAction) {
  if (getGameState().status !== 'playing' || runtime.crashed) return;
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
      } else {
        runtime.vy = FAST_FALL_VELOCITY; // slam down, slide on landing
        runtime.slideQueued = true;
      }
      break;
  }
}

function crash() {
  crashedAt = performance.now();
  runtime.crashed = true;
  runtime.fallTimer = FALL_STAY_DURATION;
  runtime.canDoubleJump = false;
  runtime.isFlipping = false;
  runtime.sliding = false;
  runtime.slideQueued = false;
  const { score, best } = getGameState();
  const newBest = Math.max(score, best);
  if (newBest > best) saveBest(newBest);
  // Freeze the final score, but wait 3 seconds before transitioning to gameover
  setGameState({ score, best: newBest });
}

function updatePlaying(dt: number) {
  const meters = runtime.distance - runtime.runStart;
  const targetSpeed = Math.min(MAX_SPEED, START_SPEED + meters * SPEED_RAMP);
  runtime.speed += (targetSpeed - runtime.speed) * Math.min(1, dt * 2);
  runtime.distance += runtime.speed * dt;

  const targetX = runtime.targetLane * LANE_WIDTH;
  const diff = targetX - runtime.x;
  // Second-order critically damped spring: smooth acceleration, momentum, and organic settle
  const springK = 280;
  const damper = 25;
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
      }
    }
  }
  if (runtime.sliding) {
    runtime.slideTimer -= dt;
    if (runtime.slideTimer <= 0) runtime.sliding = false;
  }

  spawner.update(runtime.distance, runtime.runStart, runtime.speed, runtime.obstacles);
  // recycle obstacles that are behind the camera
  const list = runtime.obstacles;
  for (let i = list.length - 1; i >= 0; i--) {
    if (-(list[i].d - runtime.distance) > 14) list.splice(i, 1);
  }

  if (checkCollision(runtime.x, runtime.y, runtime.sliding, list, runtime.distance)) {
    crash();
    return;
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
  runtime.time += dt;
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
        const { score, best } = getGameState();
        setGameState({ status: 'gameover', best: Math.max(score, best) });
      }
    } else {
      updatePlaying(dt);
    }
  } else if (status === 'menu') {
    // Stand still on the road before starting
    runtime.speed = 0;
    runtime.distance = 0;
    runtime.vx = 0;
    runtime.x = 0;
    runtime.vy = 0;
    runtime.y = 0;
    runtime.grounded = true;
    runtime.sliding = false;
    runtime.crashed = false;
    runtime.fallTimer = 0;
  } else {
    // status === 'gameover': character remains motionless in fallen pose
    runtime.speed = 0;
    runtime.vx = 0;
  }
  updateBend();
}
