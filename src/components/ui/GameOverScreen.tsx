import { useEffect, useState } from 'react';
import { resetRunSession, startGame } from '../../game/engine';
import { runtime, setGameState, useGameState } from '../../game/state';
import { requestFullscreen } from '../../utils/fullscreen';
import { playGameOverSound, restartBGM, stopBGM, stopGameOverSound } from '../../game/audio';
import { popularApi } from '../../services/popularApi';

export function GameOverScreen() {
  const coins = useGameState((s) => s.coins);
  const best = useGameState((s) => s.best);
  const isBest = coins > 0 && coins >= best;

  const [isNewRecord, setIsNewRecord] = useState(isBest);

  useEffect(() => {
    stopBGM();
    playGameOverSound();

    // Submit session score locally and compute ranks
    popularApi.submitScore(coins, coins).then(() => {
      if (coins > 0 && coins >= best) {
        setIsNewRecord(true);
      }
      // Also update brand stats cache
      const cust = popularApi.getCustomerProfile();
      if (cust) {
        popularApi.getPlayerBrandStats(cust.id || cust.phone, 'popular-electricals-qatar').catch(() => {});
      }
    });

    return () => {
      stopGameOverSound();
    };
  }, [coins, best]);

  const handleRunAgain = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    stopGameOverSound();
    resetRunSession();
    requestFullscreen();
    restartBGM();
    runtime.luluGifts = [];
    startGame(3);
  };

  const handleBackHome = () => {
    stopGameOverSound();
    resetRunSession();
    setGameState({ status: 'home' });
  };

  return (
    <div className="gameover-overlay">
      <div className="gameover-card">
        {/* Eyebrow Status */}
        <div className="gameover-eyebrow">
          {isNewRecord ? 'NEW PERSONAL RECORD!' : 'RUN FINISHED'}
        </div>

        {/* Primary Coins / Score Badge */}
        <div className="gameover-score-card">
          <span className="gameover-score-label">COINS COLLECTED</span>
          <span className="gameover-score-val">
            {coins.toLocaleString()}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '4px' }}>
              <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#CC8800" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="7.5" fill="none" stroke="#FFA500" strokeWidth="1.2" strokeDasharray="3 2" />
              <text x="12" y="15.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="#8B5A00" fontFamily="sans-serif">C</text>
            </svg>
          </span>
        </div>

        {/* Personal Best Info */}
        <div style={{ margin: '8px 0 16px', color: '#D1D5DB', fontSize: '14px', fontWeight: 600 }}>
          PERSONAL BEST: <span style={{ color: '#FFD700' }}>{Math.max(best, coins).toLocaleString()}</span>
        </div>

        {/* Continuous replay buttons: Infinite plays without limits */}
        <div className="gameover-actions-col">
          <button
            type="button"
            className="gameover-btn-gold"
            onClick={handleRunAgain}
            aria-label="Run Again"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
            </svg>
            <span>PLAY AGAIN</span>
          </button>

          <button
            type="button"
            className="gameover-btn-home"
            onClick={handleBackHome}
            aria-label="Back to Homepage"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>BACK TO HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
}
