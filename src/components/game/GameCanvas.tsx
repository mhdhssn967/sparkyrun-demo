import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { CAMERA, COLORS, FOG_FAR, FOG_NEAR } from '../../game/constants';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { useSwipeControls } from '../../hooks/useSwipeControls';
import { Environment } from './Environment';
import { FollowCamera } from './FollowCamera';
import { GameLoop } from './GameLoop';
import { Obstacles } from './Obstacles';
import { Player } from './Player';
import { Road } from './Road';
import { Sky } from './Sky';

export function GameCanvas() {
  const container = useRef<HTMLDivElement>(null);
  const [maxDpr, setMaxDpr] = useState(1.75);

  useKeyboardControls();
  useSwipeControls(container); // mobile-ready: same actions as the keyboard

  return (
    <div ref={container} className="game-canvas">
      <Canvas
        shadows
        flat // no tone mapping, so fog and sky colours match exactly
        dpr={[1, maxDpr]}
        camera={{ fov: 60, near: 0.1, far: 700, position: [0, CAMERA.height, CAMERA.distance] }}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      >
        {/* drop resolution automatically if the device can't hold the frame rate */}
        <PerformanceMonitor onDecline={() => setMaxDpr(1)} />

        <fog attach="fog" args={[COLORS.horizon, FOG_NEAR, FOG_FAR]} />
        <ambientLight color={0xfff7ed} intensity={0.55} />
        <hemisphereLight args={[0xd2ecff, 0xf6dec0, 1.4]} />
        <directionalLight
          castShadow
          color={0xfff5e4}
          intensity={2.35}
          position={[6, 14, 10]}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0005}
          shadow-camera-near={0.5}
          shadow-camera-far={45}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        {/* Soft front-side sky fill and rim light to make character and obstacles pop */}
        <directionalLight color={0xa8dbff} intensity={0.65} position={[-6, 10, -14]} />

        <Sky />
        <GameLoop />
        <Road />
        <Environment />
        <Obstacles />
        <Player />
        <FollowCamera />
      </Canvas>
    </div>
  );
}
