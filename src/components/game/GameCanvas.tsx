import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { NeutralToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import { CAMERA, COLORS, FOG_FAR, FOG_NEAR } from '../../game/constants';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { useSwipeControls } from '../../hooks/useSwipeControls';
import { Environment } from './Environment';
import { FollowCamera } from './FollowCamera';
import { GameLoop } from './GameLoop';
import { Obstacles } from './Obstacles';
import { Crystals } from './Crystals';
import { Magnets } from './Magnets';
import { Powerups } from './Powerups';
import { CoinSparkles } from './CoinSparkles';
import { LightningSparks } from './LightningSparks';
import { Player } from './Player';
import { Road } from './Road';
import { Sky } from './Sky';
import { GameEnvironment } from './GameEnvironment';

export function GameCanvas() {
  const container = useRef<HTMLDivElement>(null);
  const [maxDpr, setMaxDpr] = useState(1.75);

  useKeyboardControls();
  useSwipeControls(container); // mobile-ready: same actions as the keyboard

  return (
    <div ref={container} className="game-canvas">
      <Canvas
        shadows
        dpr={[1, maxDpr]}
        camera={{ fov: 60, near: 0.1, far: 700, position: [0, CAMERA.height, CAMERA.distance] }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: NeutralToneMapping,
          toneMappingExposure: 1.12,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFSoftShadowMap;
        }}
      >
        {/* drop resolution automatically if the device can't hold the frame rate */}
        <PerformanceMonitor onDecline={() => setMaxDpr(1)} />

        <fog attach="fog" args={[COLORS.horizon, FOG_NEAR, FOG_FAR]} />

        {/* Restrained ambient fill lighting to illuminate shadowed building faces without making the scene flat */}
        <ambientLight color={0xf2f6fa} intensity={0.28} />

        {/* Soft blue sky and warm neutral ground ambient illumination */}
        <hemisphereLight args={[0x58a8f5, 0xded2c4, 1.25]} />

        {/* Strong directional sunlight from the upper front-left with a warm golden tint */}
        <directionalLight
          castShadow
          color={COLORS.sun}
          intensity={2.35}
          position={[-12, 22, 12]}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0003}
          shadow-normalBias={0.02}
          shadow-camera-near={1}
          shadow-camera-far={45}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
        />

        {/* Horizon golden sunlight rim glow aligned with the distant sun */}
        <directionalLight color={0xffeedb} intensity={1.2} position={[4, 8, -26]} />

        {/* Subtle sky fill light on the right to illuminate shadowed faces with natural sky bounce */}
        <directionalLight color={0x8ac7fc} intensity={0.5} position={[12, 14, -6]} />

        {/* Frontal camera-side specular fill light for brilliant coin & metal reflections */}
        <directionalLight color={0xfffae6} intensity={1.15} position={[0, 9, 14]} />

        <GameEnvironment />
        <Sky />
        <GameLoop />
        <Road />
        <Environment />
        <Obstacles />
        <Crystals />
        <Magnets />
        <Powerups />
        <CoinSparkles />
        <Player />
        <LightningSparks />
        <FollowCamera />
      </Canvas>
    </div>
  );
}
