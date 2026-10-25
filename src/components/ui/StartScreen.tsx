import { useState } from 'react';
import { resetRunSession, startGame } from '../../game/engine';
import { runtime, setGameState } from '../../game/state';
import { requestFullscreen } from '../../utils/fullscreen';
import { restartBGM } from '../../game/audio';
import { popularApi } from '../../services/popularApi';
import { RunButtonHex } from './RunButtonHex';
import { HomeButtonHex } from './HomeButtonHex';

export function StartScreen() {
  const [isStarting, setIsStarting] = useState(false);

  const handleRun = async () => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const activeToken = popularApi.getActiveToken();
      const sessionRes = await popularApi.startGameSession(activeToken || undefined);

      if (!sessionRes.success) {
        setIsStarting(false);
        resetRunSession();
        setGameState({ status: 'home' });
        return;
      }

      // Configure LuLu gift opportunity if eligible for this session
      if (sessionRes.luluGift?.eligible) {
        const spawnD = sessionRes.luluGift.spawnDistance || 700;
        runtime.luluGifts = [
          {
            id: 77701,
            lane: 0,
            d: spawnD,
            y: 1.25,
            collected: false,
            collectAnim: 0,
            voucherToken: sessionRes.luluGift.voucherToken,
          },
        ];
      } else {
        runtime.luluGifts = [];
      }

      requestFullscreen();
      restartBGM();
      startGame();
    } catch (err) {
      console.error('Failed to start run session:', err);
      setIsStarting(false);
      resetRunSession();
      setGameState({ status: 'home' });
    }
  };

  const handleBackHome = () => {
    resetRunSession();
    setGameState({ status: 'home' });
  };

  return (
    <div className="start-screen-overlay">
      {/* Bottom Center Controls: RUN Button + BACK TO HOME Button */}
      <footer className="start-footer-controls">
        <RunButtonHex onClick={handleRun} />
        <HomeButtonHex onClick={handleBackHome} />
      </footer>
    </div>
  );
}
