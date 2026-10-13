import { useGameState } from '../../game/state';

export function ScoreDisplay() {
  const score = useGameState((s) => s.score);
  const best = useGameState((s) => s.best);
  return (
    <div className="hud">
      <div className="hud-score">
        {score}
        <span className="hud-unit">m</span>
      </div>
      <div className="hud-best">BEST {Math.max(best, score)} m</div>
    </div>
  );
}
