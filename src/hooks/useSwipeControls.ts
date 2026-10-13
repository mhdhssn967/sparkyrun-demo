import { useEffect } from 'react';
import type { RefObject } from 'react';
import { applyAction } from '../game/engine';
import { SWIPE_THRESHOLD } from '../game/input';

/**
 * Pointer-based swipe detection (touch + mouse drag).
 * Exactly one action per swipe stroke to prevent double lane changes and accidental jumping.
 */
export function useSwipeControls(target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = target.current;
    if (!el) return;

    let start: { x: number; y: number } | null = null;
    let hasFired = false;
    let activePointerId: number | null = null;

    const onDown = (e: PointerEvent) => {
      // Only track one primary pointer at a time
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      start = { x: e.clientX, y: e.clientY };
      hasFired = false;
    };

    const onMove = (e: PointerEvent) => {
      if (!start || hasFired || e.pointerId !== activePointerId) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Must exceed swipe distance threshold
      if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;

      // Ensure clear directional intent (1.15x ratio avoids diagonal ambiguity)
      if (absX >= absY * 1.15) {
        hasFired = true;
        applyAction(dx > 0 ? 'right' : 'left');
      } else if (absY >= absX * 1.15) {
        hasFired = true;
        applyAction(dy < 0 ? 'jump' : 'slide');
      }
    };

    const onEnd = (e: PointerEvent) => {
      if (e.pointerId === activePointerId) {
        start = null;
        hasFired = false;
        activePointerId = null;
      }
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [target]);
}
