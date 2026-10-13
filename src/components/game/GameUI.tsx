import { useGameState } from '../../game/state';
import { GameOverScreen } from '../ui/GameOverScreen';
import { ScoreDisplay } from '../ui/ScoreDisplay';
import { StartScreen } from '../ui/StartScreen';

export function GameUI() {
  const status = useGameState((s) => s.status);
  return (
    <>
      {status === 'playing' && <ScoreDisplay />}
      {status === 'menu' && <StartScreen />}
      {status === 'gameover' && <GameOverScreen />}
    </>
  );
}
