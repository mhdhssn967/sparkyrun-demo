import { Suspense, useCallback, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { CHARACTER_URL } from '../../game/constants';
import { runtime } from '../../game/state';
import { useAssetAvailable } from '../../hooks/useAssetAvailable';
import { ErrorBoundary } from '../../utils/ErrorBoundary';
import { clamp, damp } from '../../utils/math';
import { CharacterModel } from './CharacterModel';
import { PlaceholderCharacter } from './PlaceholderCharacter';

/** Uses /character.glb when present and valid, otherwise (or on any failure) the placeholder. */
function Character({ onModelLoaded }: { onModelLoaded?: () => void }) {
  const available = useAssetAvailable(CHARACTER_URL);
  const [failed, setFailed] = useState(false);
  const onUnavailable = useCallback(() => setFailed(true), []);

  if (available === false || failed) return <PlaceholderCharacter />;
  return (
    <ErrorBoundary fallback={<PlaceholderCharacter />} label="sparky.glb">
      <Suspense fallback={<PlaceholderCharacter />}>
        <CharacterModel onUnavailable={onUnavailable} onLoaded={onModelLoaded} />
      </Suspense>
    </ErrorBoundary>
  );
}

export function Player() {
  const body = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const isCustomModel = useRef(false);

  const handleModelLoaded = useCallback(() => {
    isCustomModel.current = true;
  }, []);

  useFrame((_, dt) => {
    const b = body.current;
    const t = tilt.current;
    if (!b || !t) return;

    // Normalized lateral velocity (peaks around ±1 during rapid lane switch)
    const latNorm = clamp(runtime.vx / 14, -1.2, 1.2);
    const athleticDip = -Math.abs(latNorm) * 0.08;
    b.position.set(runtime.x, runtime.y + athleticDip, 0);

    // Dynamic athletic yaw (turn head & torso up to ~28° into the cut)
    const targetYaw = latNorm * 0.48;
    // Dynamic banking roll (lean upper body up to ~22° into the turn)
    const targetRoll = -latNorm * 0.38;
    t.rotation.y = damp(t.rotation.y, targetYaw, 18, dt);
    t.rotation.z = damp(t.rotation.z, targetRoll, 18, dt);

    // Athletic forward sprint lean during lateral cuts
    const cutPitch = Math.abs(latNorm) * 0.12;
    const crashPitch = isCustomModel.current ? 0 : -1.35;
    const slidePitch = isCustomModel.current ? 0 : 1.15;
    const pitch = runtime.crashed ? crashPitch : runtime.sliding ? slidePitch : -cutPitch;
    t.rotation.x = damp(t.rotation.x, pitch, 16, dt);
  });

  return (
    <group ref={body}>
      {/* Pivot at center-of-mass (y = 0.98m): torso banks in, feet plant wide for an authentic athletic cut */}
      <group position={[0, 0.98, 0]}>
        <group ref={tilt}>
          <group position={[0, -0.98, 0]}>
            <Character onModelLoaded={handleModelLoaded} />
          </group>
        </group>
      </group>
    </group>
  );
}

