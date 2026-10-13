import { useEffect } from 'react';
import { applyAction, startGame } from '../game/engine';
import { KEY_MAP } from '../game/input';
import { getGameState } from '../game/state';
import { requestFullscreen } from '../utils/fullscreen';

/** Arrow keys / WASD / Space to play; Enter or Space starts and restarts. */
export function useKeyboardControls() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (getGameState().status === 'playing') {
        const action = KEY_MAP[e.code];
        if (action) {
          e.preventDefault();
          applyAction(action);
        }
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        requestFullscreen();
        startGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
