import { GameCanvas } from './components/game/GameCanvas';
import { GameUI } from './components/game/GameUI';

export default function App() {
  return (
    <div className="app">
      <GameCanvas />
      <GameUI />
    </div>
  );
}
