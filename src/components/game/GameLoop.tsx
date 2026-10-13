import { useFrame } from '@react-three/fiber';
import { stepFrame } from '../../game/engine';

/** Drives the simulation once per frame (runs before all visual useFrame callbacks). */
export function GameLoop() {
  useFrame((_, delta) => stepFrame(Math.min(delta, 0.05)), -2);
  return null;
}
