import { GameCanvas } from './components/game/GameCanvas';
import { GameUI } from './components/game/GameUI';
import './index.css'

export default function App() {
  return (
    <div className="app">
      <GameCanvas />
      <GameUI />
    </div>
  );
}
