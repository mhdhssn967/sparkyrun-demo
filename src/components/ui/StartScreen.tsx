import { startGame } from '../../game/engine';
import { useGameState } from '../../game/state';

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export function StartScreen() {
  const best = useGameState((s) => s.best);

  return (
    <div className="start-screen-overlay">
      {/* Top Header */}
      <header className="start-header">
        <div className="eyebrow">Endless Rush</div>
        <h1 className="title">
          SPARKY <span>RUN</span>
        </h1>
        {best > 0 && (
          <div className="start-best-badge">
            <span className="best-label">RECORD</span>
            <span className="best-val">{best}m</span>
          </div>
        )}
      </header>

      {/* Bottom Section: Play Button + Controls Info */}
      <footer className="start-footer">
        <button
          id="play-button"
          className="start-play-btn"
          onClick={(e) => {
            e.currentTarget.blur();
            startGame();
          }}
          aria-label="Play Game"
        >
          <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="play-text">PLAY</span>
        </button>

        <div className="start-hint-pill">
          {isTouch
            ? 'Swipe ← → to switch lane · ↑ jump · ↓ slide'
            : '← → / A D lane · ↑ / Space jump · ↓ / S slide'}
        </div>
      </footer>
    </div>
  );
}
