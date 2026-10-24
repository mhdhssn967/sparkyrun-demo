import { useEffect, useState } from 'react';
import { resetRunSession, startGame } from '../../game/engine';
import { setGameState, useGameState } from '../../game/state';
import { requestFullscreen } from '../../utils/fullscreen';
import { restartBGM, stopBGM } from '../../game/audio';
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
    let isMounted = true;

    const activeSession = popularApi.getActiveSession();
    const sessionId = activeSession?.sessionId || `sess_${Date.now()}`;
    const startTime = activeSession?.startedAt || Date.now() - 12000;
    const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Submit session completion with coins collected as authoritative score
    popularApi
      .endGameSession(sessionId, coins, coins, durationSeconds)
      .then((res) => {
        if (isMounted) {
          setSessionResult(res);
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
    };
  }, [coins, best]);

  const livesLeft =
    typeof sessionResult?.livesRemaining === 'number' ? sessionResult.livesRemaining : 0;
  const isNewRecord = sessionResult?.isNewHighScore || isBest;

  const handleRunAgain = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
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
    startGame();
  };

  return (
    <div className="overlay">
      <div className="panel gameover-panel">
        <div className="eyebrow">{isNewRecord ? '🎉 NEW RECORD!' : 'Run Finished!'}</div>

        {/* Primary Coins Display */}
        <div className="big-score">
          {coins}
          <span className="hud-unit" style={{ fontSize: '26px', marginLeft: '8px' }}>
            🪙
          </span>
        </div>

        {/* Lives Left with Homepage Heart-Like Design */}
        <div style={{ margin: '14px 0 22px', display: 'flex', justifyContent: 'center' }}>
          <LivesLeftDisplay livesLeft={livesLeft} maxLives={3} />
        </div>

        {/* Action Buttons: ONLY Run Again and Back to Home */}
        <div className="gameover-btn-group">
          {livesLeft > 0 ? (
            <>
              <button
                className="btn btn-primary"
                disabled={isStartingNext}
                onClick={handleRunAgain}
              >
                {isStartingNext ? 'Starting...' : 'Run again'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetRunSession();
                  setGameState({ status: 'home' });
                }}
              >
                Back to home
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                resetRunSession();
                setGameState({ status: 'home' });
              }}
            >
              Back to home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
