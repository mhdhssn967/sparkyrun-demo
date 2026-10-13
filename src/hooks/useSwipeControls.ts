import { useEffect } from 'react';
import type { RefObject } from 'react';
import { applyAction } from '../game/engine';
import { SWIPE_THRESHOLD } from '../game/input';

/** Pointer-based swipe detection (touch + mouse drag). Fires as soon as the threshold is crossed. */
export function useSwipeControls(target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;

    const onDown = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) applyAction(dx > 0 ? 'right' : 'left');
      else applyAction(dy < 0 ? 'jump' : 'slide');
      start = { x: e.clientX, y: e.clientY }; // allow chained swipes in one drag
    };
    const onUp = () => {
      start = null;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [target]);
}
