import type { GameAction } from '../types';

export const KEY_MAP: Record<string, GameAction> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowDown: 'slide',
  KeyS: 'slide',
};

/** Pixels a pointer must travel before it counts as a swipe. */
export const SWIPE_THRESHOLD = 32;
