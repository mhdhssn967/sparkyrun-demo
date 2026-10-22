import { useSyncExternalStore } from 'react';
import type { GameStatus, RuntimeState } from '../types';

interface GameStore {
  status: GameStatus;
  score: number;
  best: number;
  coins: number;
  lives: number;
  paused: boolean;
  magnetTime: number;
  magnetActive: boolean;
  turboTime: number;
  turboActive: boolean;
}

const BEST_KEY = 'doha-dash-best';

function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(value: number) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* storage unavailable (private mode) – ignore */
  }
}

let store: GameStore = {
  status: 'home',
  score: 0,
  best: loadBest(),
  coins: 0,
  lives: 3,
  paused: false,
  magnetTime: 0,
  magnetActive: false,
  turboTime: 0,
  turboActive: false,
};
const listeners = new Set<() => void>();

export const getGameState = () => store;
export const isGamePaused = () => store.paused;

export function setGameState(patch: Partial<GameStore>) {
  store = { ...store, ...patch };
  listeners.forEach((l) => l());
}

export function ensureInspectCrystals() {
  const d = runtime.distance;
  const ahead = runtime.crystals.filter((c) => !c.collected && c.d >= d + 2 && c.d <= d + 30);
  if (ahead.length < 2) {
    const testIds = [88801, 88802, 88803, 88804, 88805];
    runtime.crystals = runtime.crystals.filter((c) => !testIds.includes(c.id));
    runtime.crystals.push(
      { id: 88801, lane: 0, d: d + 5.5, y: 1.05, collected: false, collectAnim: 0 },
      { id: 88802, lane: -1, d: d + 7.5, y: 1.05, collected: false, collectAnim: 0 },
      { id: 88803, lane: 1, d: d + 7.5, y: 1.05, collected: false, collectAnim: 0 },
      { id: 88804, lane: 0, d: d + 9.5, y: 1.05, collected: false, collectAnim: 0 },
      { id: 88805, lane: 0, d: d + 13.5, y: 1.05, collected: false, collectAnim: 0 },
    );
  }
  const aheadMagnets = runtime.magnets.filter((m) => !m.collected && m.d >= d + 2 && m.d <= d + 30);
  if (aheadMagnets.length === 0) {
    runtime.magnets.push({
      id: 99901,
      lane: 0,
      d: d + 11.5,
      y: 1.15,
      collected: false,
      collectAnim: 0,
    });
  }
}

export function togglePause() {
  const nextPaused = !store.paused;
  if (nextPaused) {
    ensureInspectCrystals();
  }
  setGameState({ paused: nextPaused });
}

export function addCoins(amount = 1) {
  setGameState({ coins: store.coins + amount });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** React hook for the low-frequency UI state (status / score / best). */
export function useGameState<T>(selector: (s: GameStore) => T): T {
  return useSyncExternalStore(subscribe, () => selector(store));
}

function createRuntime(): RuntimeState {
  return {
    distance: 0,
    runStart: 0,
    speed: 0,
    x: 0,
    vx: 0,
    targetLane: 0,
    y: 0,
    vy: 0,
    grounded: true,
    canDoubleJump: false,
    isFlipping: false,
    flipHangTimer: 0,
    sliding: false,
    slideTimer: 0,
    slideQueued: false,
    rollCount: 0,
    crashed: false,
    fallTimer: 0,
    time: 0,
    magnetTimer: 0,
    turboTimer: 0,
    obstacles: [],
    crystals: [],
    magnets: [],
    powerups: [],
  };
}

/** High-frequency simulation state, read directly inside useFrame loops (no re-renders). */
export const runtime: RuntimeState = createRuntime();
