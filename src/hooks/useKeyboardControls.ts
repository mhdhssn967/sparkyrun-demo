import { useEffect } from 'react';
import { applyAction, resetRunSession, startGame } from '../game/engine';
import { KEY_MAP } from '../game/input';
import { getGameState, setGameState, togglePause } from '../game/state';
import { requestFullscreen } from '../utils/fullscreen';
import { restartBGM } from '../game/audio';

/** Arrow keys / WASD / Space to play; Enter or Space starts and restarts. */
export function useKeyboardControls() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      // 'F' key toggles game pause & crystal inspector mode at any time
      if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F' || (e.code === 'Escape' && getGameState().paused)) {
        e.preventDefault();
        togglePause();
        return;
      }

      // Do not accept gameplay input while paused
      if (getGameState().paused) return;

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
        const currentStatus = getGameState().status;
        if (currentStatus === 'home') {
          requestFullscreen();
          resetRunSession();
          setGameState({ status: 'menu' });
          return;
        }
        requestFullscreen();
        restartBGM();
        startGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
