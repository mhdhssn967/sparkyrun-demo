import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  Vector3,
} from 'three';
import type { BufferGeometry, Material } from 'three';
import { LANE_WIDTH, SPAWN_AHEAD } from '../../game/constants';
import { getGameState, runtime } from '../../game/state';
import { getCrystalConfig } from '../../game/crystalConfig';
import { applyBend } from '../../utils/bendMaterial';

const DEG2RAD = Math.PI / 180;
const CRYSTAL_URL = '/assets/Goldcoin.glb';
const CRYSTAL_CAPACITY = 150;
const tmp = new Object3D();
const hudTargetVec = new Vector3();
const hudRayDir = new Vector3();
const hudWorldPos = new Vector3();

export function Crystals() {
  const { scene } = useGLTF(CRYSTAL_URL);
  const meshRef = useRef<InstancedMesh>(null);

  const { geometry, material } = useMemo<{ geometry: BufferGeometry; material: Material }>(() => {
    let geo: BufferGeometry | null = null;
    let mat: Material | null = null;

    scene.traverse((child) => {
      if ((child as Mesh).isMesh && !geo) {
        const m = child as Mesh;
        geo = m.geometry.clone();
        geo.center();
        geo.computeVertexNormals();
        geo.scale(0.30, 0.30, 0.30);

        if (Array.isArray(m.material)) {
          mat = m.material[0].clone();
        } else if (m.material) {
          mat = m.material.clone();
        }
      }
    });

    if (!geo) {
      geo = new OctahedronGeometry(0.45, 0);
      geo.computeVertexNormals();
    }

    // Upgrade to a brilliant, shiny 24K arcade gold PBR material
    let goldMat: MeshStandardMaterial;
    if (mat && (mat as MeshStandardMaterial).isMeshStandardMaterial) {
      goldMat = mat as MeshStandardMaterial;
    } else {
      goldMat = new MeshStandardMaterial();
    }

    goldMat.color = new Color('#ffe033');         // Radiant 24-karat arcade gold yellow
    goldMat.roughness = 0.8;                     // Mirror-smooth polish for sparkling specular glints
    goldMat.metalness = 1;                     // High metallic reflection with rich gold diffuse body
    goldMat.emissive = new Color('#1c1400');       // Deep subtle gold base (eliminates flat orange wash)
    goldMat.emissiveIntensity = 5;
    goldMat.envMapIntensity = 3.2;                // Vivid reflections of sky and sun from PMREM environment map
    goldMat.side = DoubleSide;                    // Double-sided rendering so all faces & bevels shine
    goldMat.transparent = false;
    goldMat.needsUpdate = true;

    const finalMat = applyBend(goldMat, 'goldcoin-bend-v3');
    return { geometry: geo, material: finalMat };
  }, [scene]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
      if (material) {
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      }
    };
  }, [geometry, material]);

  useFrame(({ camera, size }) => {
    const mesh = meshRef.current;
    if (!mesh || !geometry) return;

    const status = getGameState().status;
    if (status === 'home' || status === 'menu') {
      mesh.count = 0;
      mesh.instanceMatrix.needsUpdate = true;
      return;
    }

    const config = getCrystalConfig();
    const rotXRad = (config.rotX ?? 0) * DEG2RAD;
    const rotYRad = (config.rotY ?? 0) * DEG2RAD;
    const rotZRad = (config.rotZ ?? 0) * DEG2RAD;
    const scale = config.scale ?? 1.0;
    const heightOffset = config.heightOffset ?? 0;

    // Calculate 3D position corresponding to the top-right coin collection HUD element
    // Badge center in viewport is approximately 68px from right edge and 37px from top
    const ndcX = ((size.width - 68) / size.width) * 2 - 1;
    const ndcY = -(37 / size.height) * 2 + 1;

    hudTargetVec.set(ndcX, ndcY, 0.5).unproject(camera);
    hudRayDir.copy(hudTargetVec).sub(camera.position).normalize();
    // Position target 2.2m directly in front of the camera along the unprojected ray
    hudWorldPos.copy(camera.position).addScaledVector(hudRayDir, 2.2);

    let n = 0;
    const time = runtime.time;

    for (const c of runtime.crystals) {
      if (n >= CRYSTAL_CAPACITY) break;

      const spinY = config.autoSpin ? time * 2.8 + c.d * 0.4 : 0;

      if (c.collected) {
        if (c.collectAnim <= 0) continue;
        const progress = Math.min(1, Math.max(0, 1.0 - c.collectAnim));

        const startX = c.pickupX ?? (c.lane * LANE_WIDTH);
        const startY = c.pickupY ?? (c.y + heightOffset);
        const startZ = c.pickupZ ?? 0;

        // Smooth flight acceleration towards HUD element
        const tPos = Math.pow(progress, 1.3);
        let currX = startX + (hudWorldPos.x - startX) * tPos;
        let currY = startY + (hudWorldPos.y - startY) * progress;
        let currZ = startZ + (hudWorldPos.z - startZ) * tPos;

        // Upward parabolic arc lift
        const arc = Math.sin(progress * Math.PI);
        currY += arc * 1.1;
        currX += arc * (c.lane >= 0 ? 0.35 : -0.2);

        // Shrink smoothly down as it flies towards the HUD element
        let currentScale: number;
        if (progress < 0.15) {
          currentScale = scale * (1.0 + (progress / 0.15) * 0.15); // subtle initial pop 1.0 -> 1.15
        } else {
          const shrinkT = (progress - 0.15) / 0.85;
          currentScale = scale * 1.15 * Math.max(0, 1.0 - Math.pow(shrinkT, 1.25));
        }

        // Rapid arcade spin during flight
        const flySpin = spinY * 4.0 + progress * 24.0;
        tmp.position.set(currX, currY, currZ);
        tmp.rotation.set(rotXRad + progress * 2.0, flySpin, rotZRad + progress * 1.5);
        tmp.scale.set(currentScale, currentScale, currentScale);

        c.currentX = currX;
        c.currentY = currY;
        c.currentZ = currZ;
        c.currentScale = currentScale;
      } else if (c.attracted && c.pullX !== undefined) {
        // Coin being magnetically attracted to the runner!
        const px = c.pullX;
        const py = c.pullY ?? c.y;
        const pz = c.pullZ ?? 0;
        tmp.position.set(px, py, pz);
        tmp.rotation.set(rotXRad, spinY * 3.5 + rotYRad, rotZRad);
        tmp.scale.set(scale, scale, scale);

        c.currentX = px;
        c.currentY = py;
        c.currentZ = pz;
        c.currentScale = scale;
      } else {
        const z = -(c.d - runtime.distance);
        // Only draw crystals within visible range ahead of camera
        if (z > 14 || z < -(SPAWN_AHEAD + 10)) continue;

        const x = c.lane * LANE_WIDTH;
        const bobY = Math.sin(time * 3.8 + c.d * 0.5) * 0.08;
        const currY = c.y + heightOffset + bobY;

        tmp.position.set(x, currY, z);
        tmp.rotation.set(rotXRad, spinY + rotYRad, rotZRad);
        tmp.scale.set(scale, scale, scale);

        c.currentX = x;
        c.currentY = currY;
        c.currentZ = z;
        c.currentScale = scale;
      }

      tmp.updateMatrix();
      mesh.setMatrixAt(n, tmp.matrix);
      n++;
    }

    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!geometry) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, CRYSTAL_CAPACITY]}
      frustumCulled={false}
      onUpdate={(self) => self.instanceMatrix.setUsage(DynamicDrawUsage)}
    />
  );
}

useGLTF.preload(CRYSTAL_URL);
