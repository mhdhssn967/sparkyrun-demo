import { useSyncExternalStore } from 'react';
import type { GameStatus, RuntimeState } from '../types';

interface GameStore {
  status: GameStatus;
  score: number;
  best: number;
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

let store: GameStore = { status: 'menu', score: 0, best: loadBest() };
const listeners = new Set<() => void>();

export const getGameState = () => store;

export function setGameState(patch: Partial<GameStore>) {
  store = { ...store, ...patch };
  listeners.forEach((l) => l());
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
    crashed: false,
    fallTimer: 0,
    time: 0,
    obstacles: [],
  };
}

/** High-frequency simulation state, read directly inside useFrame loops (no re-renders). */
export const runtime: RuntimeState = createRuntime();
