import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  AdditiveBlending,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from 'three';
import { LANE_WIDTH, SPAWN_AHEAD } from '../../game/constants';
import { getGameState, runtime } from '../../game/state';
import { applyBend } from '../../utils/bendMaterial';

const MAGNET_URL = '/assets/magnet.glb';
const MAX_MAGNETS = 1;
// Raw mesh is 228 x 194 x 40 units.
// Scale 0.0078 makes it ~1.78m wide x 1.51m tall - prominent, clearly visible arcade power-up!
const MAGNET_SCALE = 0.0048;

const DEG2RAD = Math.PI / 180;
// Magnet Orientation Configuration:
// Raw GLB model: horseshoe tips point to -X (to the sides) with flat face in XY.
// - MAGNET_ROT_Z = -90° rotates the model so the two silver tips point UPWARDS (+Y)
// - MAGNET_ROT_X = 45° tilts the magnet 45° back towards the camera for a clear 3D arcade view
export const MAGNET_ROT_X = 45 * DEG2RAD;
export const MAGNET_ROT_Y = 0 * DEG2RAD;
export const MAGNET_ROT_Z = -90 * DEG2RAD;

export function Magnets() {
  const { scene } = useGLTF(MAGNET_URL);
  const groupsRef = useRef<(Group | null)[]>([]);
  const aurasRef = useRef<(Mesh | null)[]>([]);

  // Persistent pool of cloned 3D models with upgraded PBR materials
  const models = useMemo(() => {
    return Array.from({ length: MAX_MAGNETS }).map((_, idx) => {
      const clone = scene.clone(true);
      clone.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const m = child as Mesh;
          m.castShadow = false;
          m.receiveShadow = false;

          const upgradeMaterial = (mat: MeshStandardMaterial) => {
            const newMat = mat.clone();
            const matName = (newMat.name || '').toLowerCase();
            if (matName.includes('mat') || matName.includes('red')) {
              // Vibrant candy red horseshoe arch
              newMat.color.set('#ff1a3c');
              newMat.roughness = 0.25;
              newMat.metalness = 0.5;
              newMat.emissive.set('#5e0512');
              newMat.emissiveIntensity = 1.0;
            } else {
              // Chrome silver magnetic pole caps
              newMat.color.set('#f8fafc');
              newMat.roughness = 0.15;
              newMat.metalness = 0.95;
              newMat.emissive.set('#334155');
              newMat.emissiveIntensity = 0.6;
            }
            newMat.side = DoubleSide;
            return applyBend(newMat, `magnet-mat-${idx}-${newMat.name}`);
          };

          if (Array.isArray(m.material)) {
            m.material = m.material.map((mat) => upgradeMaterial(mat as MeshStandardMaterial));
          } else if (m.material) {
            m.material = upgradeMaterial(m.material as MeshStandardMaterial);
          }
        }
      });
      return clone;
    });
  }, [scene]);

  const auraMaterial = useMemo(() => {
    const mat = new MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthWrite: false,
    });
    return applyBend(mat, 'magnet-aura-bend-v2');
  }, []);

  useFrame(() => {
    const status = getGameState().status;
    if (status === 'home' || status === 'menu') {
      for (let i = 0; i < MAX_MAGNETS; i++) {
        const grp = groupsRef.current[i];
        if (grp) grp.visible = false;
      }
      return;
    }

    const time = runtime.time;
    const magnets = runtime.magnets;
    let renderedCount = 0;

    for (let i = 0; i < magnets.length; i++) {
      const m = magnets[i];
      const z = -(m.d - runtime.distance);
      // Visible range ahead & behind camera
      if (z > 14 || z < -(SPAWN_AHEAD + 10)) continue;
      if (renderedCount >= MAX_MAGNETS) break;

      const grp = groupsRef.current[renderedCount];
      const aura = aurasRef.current[renderedCount];

      if (grp) {
        grp.visible = true;
        const x = m.lane * LANE_WIDTH;
        const bobY = Math.sin(time * 3.8 + m.d * 0.5) * 0.15;

        if (m.collected) {
          // Rapid collection pop and upward lift before disappearing
          const popScale = Math.max(0, m.collectAnim) * MAGNET_SCALE * 1.35;
          const popLift = (1.0 - m.collectAnim) * 1.2;
          grp.position.set(x, m.y + bobY + popLift, z);
          grp.scale.set(popScale, popScale, popScale);
          grp.rotation.set(0.2, time * 8.0, 0.15);
        } else {
          grp.position.set(x, m.y + bobY, z);

          // Light pulsing breathing scale effect (±8%)
          const pulse = 1.0 + Math.sin(time * 4.2 + m.d * 0.4) * 0.08;
          const currentScale = MAGNET_SCALE * pulse;
          grp.scale.set(currentScale, currentScale, currentScale);

          // Rotate magnet smoothly in Y while maintaining the 45° upward orientation
          const rotY = (time * 2.4 + m.d * 0.2) % (Math.PI * 2);
          grp.rotation.set(MAGNET_ROT_X, rotY, MAGNET_ROT_Z);

          if (aura) {
            const auraPulse = 1.0 + 0.18 * Math.sin(time * 6.0 + i);
            aura.scale.set(auraPulse, auraPulse, auraPulse);
          }
        }
      }
      renderedCount++;
    }

    // Hide any unused groups in the pool
    for (let i = renderedCount; i < MAX_MAGNETS; i++) {
      const grp = groupsRef.current[i];
      if (grp) grp.visible = false;
    }
  });

  return (
    <group>
      {models.map((model, idx) => (
        <group
          key={idx}
          ref={(el) => {
            groupsRef.current[idx] = el;
          }}
          visible={false}
        >
          <primitive object={model} />
          {/* Glowing magnetic energy aura ring */}
          <mesh
            ref={(el) => {
              aurasRef.current[idx] = el;
            }}
            position={[0, -0.05, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            material={auraMaterial}
          >
            <ringGeometry args={[80, 115, 32]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

useGLTF.preload(MAGNET_URL);
