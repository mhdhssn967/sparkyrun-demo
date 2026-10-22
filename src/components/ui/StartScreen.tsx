import { resetRunSession, startGame } from '../../game/engine';
import { setGameState } from '../../game/state';
import { requestFullscreen } from '../../utils/fullscreen';
import { restartBGM } from '../../game/audio';
import { RunButtonHex } from './RunButtonHex';
import { HomeButtonHex } from './HomeButtonHex';

export function StartScreen() {
  const handleRun = () => {
    requestFullscreen();
    restartBGM();
    startGame();
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
