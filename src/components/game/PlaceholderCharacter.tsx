import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshLambertMaterial } from 'three';
import type { Group } from 'three';
import { COLORS } from '../../game/constants';
import { getGameState, runtime } from '../../game/state';
import { damp } from '../../utils/math';

/**
 * Stylised stand-in runner (maroon jersey, white ghutra) built from a handful of primitives.
 * Origin sits at the feet. Limbs are animated procedurally; body tilt for slide/crash lives in <Player />.
 */
export function PlaceholderCharacter() {
  const body = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const phase = useRef(0);

  const mats = useMemo(
    () => ({
      jersey: new MeshLambertMaterial({ color: COLORS.maroon }),
      white: new MeshLambertMaterial({ color: COLORS.white }),
      skin: new MeshLambertMaterial({ color: 0xc08b64 }),
      black: new MeshLambertMaterial({ color: 0x15161a }),
    }),
    [],
  );

  useFrame((_, dt) => {
    const status = getGameState().status;
    const isMenu = status === 'menu' || status === 'home';
    if (status !== 'gameover' && !isMenu) {
      phase.current += dt * (5 + runtime.speed * 0.42);
    } else if (isMenu) {
      phase.current += dt * 1.6; // gentle idle breathing
    }
    const p = phase.current;
    const sw = Math.sin(p);
    const air = !runtime.grounded;

    let lL = sw * 0.95;
    let lR = -sw * 0.95;
    let aL = -sw * 0.85;
    let aR = sw * 0.85;
    if (isMenu) {
      lL = Math.sin(p * 0.5) * 0.06;
      lR = -Math.sin(p * 0.5) * 0.06;
      aL = Math.sin(p) * 0.08;
      aR = -Math.sin(p) * 0.08;
    } else if (air) {
      lL = 0.9;
      lR = -0.5;
      aL = 2.3;
      aR = 1.9;
    } else if (runtime.sliding || runtime.crashed) {
      lL = lR = 0.25;
      aL = aR = 1.0;
    }

    const k = 28;
    if (legL.current) legL.current.rotation.x = damp(legL.current.rotation.x, lL, k, dt);
    if (legR.current) legR.current.rotation.x = damp(legR.current.rotation.x, lR, k, dt);
    if (armL.current) armL.current.rotation.x = damp(armL.current.rotation.x, aL, k, dt);
    if (armR.current) armR.current.rotation.x = damp(armR.current.rotation.x, aR, k, dt);
    if (body.current) body.current.position.y = air || runtime.sliding ? 0 : Math.abs(Math.cos(p)) * 0.05;
  });

  return (
    <group ref={body}>
      {/* torso + shorts */}
      <mesh position={[0, 1.15, 0]} material={mats.jersey}>
        <capsuleGeometry args={[0.19, 0.36, 4, 10]} />
      </mesh>
      <mesh position={[0, 0.93, 0]} material={mats.white}>
        <cylinderGeometry args={[0.2, 0.19, 0.26, 12]} />
      </mesh>
      {/* head, ghutra, agal */}
      <mesh position={[0, 1.64, 0]} material={mats.skin}>
        <sphereGeometry args={[0.16, 14, 12]} />
      </mesh>
      <mesh position={[0, 1.67, 0]} material={mats.white}>
        <sphereGeometry args={[0.175, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
      </mesh>
      <mesh position={[0, 1.7, 0]} rotation-x={Math.PI / 2} material={mats.black}>
        <torusGeometry args={[0.165, 0.017, 6, 18]} />
      </mesh>
      <mesh position={[0, 1.58, 0.14]} material={mats.white}>
        <boxGeometry args={[0.28, 0.28, 0.06]} />
      </mesh>
      {/* legs (pivot at the hip) */}
      {([-1, 1] as const).map((s) => (
        <group key={s} ref={s < 0 ? legL : legR} position={[s * 0.1, 0.9, 0]}>
          <mesh position={[0, -0.4, 0]} material={mats.skin}>
            <capsuleGeometry args={[0.08, 0.62, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.84, -0.05]} material={mats.white}>
            <boxGeometry args={[0.18, 0.12, 0.3]} />
          </mesh>
        </group>
      ))}
      {/* arms (pivot at the shoulder) */}
      {([-1, 1] as const).map((s) => (
        <group key={s} ref={s < 0 ? armL : armR} position={[s * 0.27, 1.4, 0]}>
          <mesh position={[0, -0.22, 0]} material={mats.skin}>
            <capsuleGeometry args={[0.06, 0.32, 4, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
