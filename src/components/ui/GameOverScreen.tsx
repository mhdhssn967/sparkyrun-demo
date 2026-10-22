import { useEffect, useState } from 'react';
import { resetRunSession, startGame } from '../../game/engine';
import { setGameState, useGameState } from '../../game/state';
import { requestFullscreen } from '../../utils/fullscreen';
import { restartBGM, stopBGM } from '../../game/audio';
import { popularApi } from '../../services/popularApi';
import { LeaderboardPage } from './LeaderboardModal';
import { RewardsPage } from './RewardsModal';

export function GameOverScreen() {
  const score = useGameState((s) => s.score);
  const coins = useGameState((s) => s.coins);
  const best = useGameState((s) => s.best);
  const isBest = score > 0 && score >= best;

  const [ranking, setRanking] = useState<{ rankToday: number; rankGlobal: number } | null>(null);
  const [activePage, setActivePage] = useState<'leaderboard' | 'rewards' | null>(null);

  useEffect(() => {
    stopBGM();
    // Submit finalized score to Popular Electricals API
    if (score > 0) {
      popularApi.submitScore(score, coins).then((res) => {
        setRanking(res);
      });
    }
  }, [score, coins]);

  if (activePage === 'leaderboard') {
    return <LeaderboardPage onBack={() => setActivePage(null)} />;
  }

  if (activePage === 'rewards') {
    return <RewardsPage onBack={() => setActivePage(null)} />;
  }

  return (
    <div className="overlay">
      <div className="panel gameover-panel">
        <div className="eyebrow">{isBest ? '🎉 New Record!' : 'Run Finished!'}</div>
        <div className="big-score">
          {score}
          <span className="hud-unit">m</span>
        </div>
        <p className="subtitle">
          Best: <strong>{best}m</strong> • Coins: <strong>🪙 {coins}</strong>
        </p>

        {/* Live Today Rank feedback banner */}
        {ranking && (
          <div className="gameover-rank-banner">
            <span className="rank-trophy">⚡</span>
            <span>
              Today's Board Rank: <strong>#{ranking.rankToday}</strong> in Qatar!
            </span>
          </div>
        )}

        {/* Quick Campaign Nav Buttons */}
        <div className="gameover-secondary-actions">
          <button
            type="button"
            className="gameover-quick-btn"
            onClick={() => setActivePage('leaderboard')}
          >
            🏆 Leaderboard
          </button>
          <button
            type="button"
            className="gameover-quick-btn"
            onClick={() => setActivePage('rewards')}
          >
            🎁 Claim Rewards
          </button>
        </div>

        <div className="gameover-btn-group">
          <button
            className="btn btn-primary"
            onClick={(e) => {
              e.currentTarget.blur();
              requestFullscreen();
              restartBGM();
              startGame();
            }}
          >
            Run again
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              resetRunSession();
              setGameState({ status: 'home' });
            }}
          >
            Home
          </button>
        </div>

        <p className="hint">Press Enter or Space to run again</p>
      </div>
    </div>
  );
}
