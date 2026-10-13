import { startGame } from '../../game/engine';
import { useGameState } from '../../game/state';

export function GameOverScreen() {
  const score = useGameState((s) => s.score);
  const best = useGameState((s) => s.best);
  const isBest = score > 0 && score >= best;
  return (
    <div className="overlay">
      <div className="panel">
        <div className="eyebrow">{isBest ? 'New record!' : 'Game over'}</div>
        <div className="big-score">
          {score}
          <span className="hud-unit">m</span>
        </div>
        <p className="subtitle">Best: {best} m</p>
        <button
          className="btn"
          onClick={(e) => {
            e.currentTarget.blur();
            startGame();
          }}
        >
          Run again
        </button>
        <p className="hint">Press Enter or Space</p>
      </div>
    </div>
  );
}
