import { useGameState } from '../../game/state';
import { GameOverScreen } from '../ui/GameOverScreen';
import { ScoreDisplay } from '../ui/ScoreDisplay';
import { StartScreen } from '../ui/StartScreen';
import { HomeScreen } from '../ui/HomeScreen';
import { MuteButton } from '../ui/MuteButton';
export function GameUI() {
  const status = useGameState((s) => s.status);

  return (
    <>
      {status !== 'playing' && <MuteButton />}
      {status === 'home' && <HomeScreen />}
      {status === 'menu' && <StartScreen />}
      {status === 'playing' && <ScoreDisplay />}
      {status === 'gameover' && <GameOverScreen />}
    </>
  );
}
