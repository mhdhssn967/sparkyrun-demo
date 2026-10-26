import { useEffect, useState } from 'react';
import { resetRunSession, startGame } from '../../game/engine';
import { runtime, setGameState, useGameState } from '../../game/state';
import { requestFullscreen } from '../../utils/fullscreen';
import { playGameOverSound, restartBGM, stopBGM, stopGameOverSound } from '../../game/audio';
import { popularApi } from '../../services/popularApi';
import type { EndSessionResponse } from '../../types/customer';
import { LivesLeftDisplay } from './LivesLeftDisplay';

export function GameOverScreen() {
  const coins = useGameState((s) => s.coins);
  const best = useGameState((s) => s.best);
  const isBest = coins > 0 && coins >= best;

  const [sessionResult, setSessionResult] = useState<EndSessionResponse | null>(null);
  const [isStartingNext, setIsStartingNext] = useState<boolean>(false);

  useEffect(() => {
    stopBGM();
    playGameOverSound();
    let isMounted = true;

    const activeSession = popularApi.getActiveSession();
    const sessionId = activeSession?.sessionId || `sess_${Date.now()}`;
    const startTime = activeSession?.startedAt || Date.now() - 12000;
    const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Submit session completion with coins collected as authoritative score
    popularApi
      .endGameSession(sessionId, coins, coins, durationSeconds)
      .then(async (res) => {
        if (isMounted) {
          setSessionResult(res);
          // Sync brand stats immediately so real-time total points and highest score update
          try {
            const cust = popularApi.getCustomerProfile();
            if (cust) {
              await popularApi.getPlayerBrandStats(cust.id || cust.phone, 'popular-electricals-qatar');
            }
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        // Fallback to legacy submission if network failure
        popularApi.submitScore(coins, coins).then((legacyRes) => {
          if (isMounted) {
            setSessionResult({
              success: true,
              bestScore: Math.max(best, coins),
              totalScore: (best || 0) + coins,
              livesRemaining: 0,
              rankToday: legacyRes.rankToday,
              rankGlobal: legacyRes.rankGlobal,
            });
          }
        });
      });

    return () => {
      isMounted = false;
      stopGameOverSound();
    };
  }, [coins, best]);

  const livesLeft =
    typeof sessionResult?.livesRemaining === 'number' ? sessionResult.livesRemaining : 0;
  const isNewRecord = sessionResult?.isNewHighScore || isBest;

  const handleRunAgain = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    stopGameOverSound();
    if (livesLeft <= 0) {
      resetRunSession();
      setGameState({ status: 'home' });
      return;
    }

    setIsStartingNext(true);
    const startRes = await popularApi.startGameSession();
    if (!startRes.success) {
      setIsStartingNext(false);
      resetRunSession();
      setGameState({ status: 'home' });
      return;
    }

    requestFullscreen();
    restartBGM();

    // Configure LuLu gift opportunity if eligible for this retry session
    if (startRes.luluGift?.eligible) {
      const spawnD = startRes.luluGift.spawnDistance || 700;
      runtime.luluGifts = [
        {
          id: 77701,
          lane: 0,
          d: spawnD,
          y: 1.25,
          collected: false,
          collectAnim: 0,
          voucherToken: startRes.luluGift.voucherToken,
        },
      ];
    } else {
      runtime.luluGifts = [];
    }

    startGame(startRes.livesRemaining);
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

        {/* Lives Left with Homepage Heart-Like Design */}
        <div style={{ margin: '4px 0 18px', display: 'flex', justifyContent: 'center' }}>
          <LivesLeftDisplay livesLeft={livesLeft} maxLives={3} />
        </div>

        {/* Action Buttons styled matching Homepage with clean SVG icons */}
        <div className="gameover-actions-col">
          {livesLeft > 0 ? (
            <>
              <button
                type="button"
                className="gameover-btn-gold"
                disabled={isStartingNext}
                onClick={handleRunAgain}
                aria-label="Run Again"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
                </svg>
                <span>{isStartingNext ? 'STARTING...' : 'RUN AGAIN'}</span>
              </button>
              <button
                type="button"
                className="gameover-btn-home"
                onClick={() => {
                  stopGameOverSound();
                  resetRunSession();
                  setGameState({ status: 'home' });
                }}
                aria-label="Back to Homepage"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>BACK TO HOME</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="gameover-btn-home"
              onClick={() => {
                stopGameOverSound();
                resetRunSession();
                setGameState({ status: 'home' });
              }}
              aria-label="Back to Homepage"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>BACK TO HOME</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
