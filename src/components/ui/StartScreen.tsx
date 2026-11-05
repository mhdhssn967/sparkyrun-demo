import { useState } from 'react';
import { resetRunSession, startGame } from '../../game/engine';
import { runtime, setGameState } from '../../game/state';
import { requestFullscreen } from '../../utils/fullscreen';
import { restartBGM } from '../../game/audio';
import { RunButtonHex } from './RunButtonHex';
import { HomeButtonHex } from './HomeButtonHex';

export function StartScreen() {
  const [isStarting, setIsStarting] = useState(false);

  const handleRun = () => {
    if (isStarting) return;
    setIsStarting(true);

    runtime.luluGifts = [];
    requestFullscreen();
    restartBGM();
    startGame(3); // start with 3 lives in-game, infinite replays on gameover
  };

  const handleBackHome = () => {
    resetRunSession();
    setGameState({ status: 'home' });
  };

  return (
    <div className="start-screen-overlay">
      <footer className="start-footer-controls">
        <RunButtonHex onClick={handleRun} />
        <HomeButtonHex onClick={handleBackHome} />
      </footer>
    </div>
  );
}
