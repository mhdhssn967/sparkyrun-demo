import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
} from 'three';
import { sparklePool } from '../../game/sparkles';

const MAX_SPARKLES = 64;
const tmp = new Object3D();

const COLOR_WHITE = new Color('#ffffff');
const COLOR_GOLD = new Color('#ffe066');
const COLOR_PALE = new Color('#fffbe0');

function createStarGeometry(): BufferGeometry {
  const geo = new BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  // Center vertex
  vertices.push(0, 0, 0);

  // 16 perimeter vertices for a crisp, luminous 8-point diamond star
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    let r = 0.08;
    if (i % 4 === 0) {
      r = 0.50; // cardinal spikes (top, bottom, left, right)
    } else if (i % 2 === 0) {
      r = 0.26; // diagonal spikes
    }
    vertices.push(Math.cos(angle) * r, Math.sin(angle) * r, 0);
  }

  for (let i = 1; i <= 16; i++) {
    const next = i === 16 ? 1 : i + 1;
    indices.push(0, i, next);
  }

  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function CoinSparkles() {
  const meshRef = useRef<InstancedMesh>(null);

  const { geometry, material } = useMemo(() => {
    const geo = createStarGeometry();

    // Glowing unlit additive material with depthTest disabled so burst sparkles always shine clearly on top
    const mat = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  useEffect(() => {
    if (meshRef.current && !meshRef.current.instanceColor) {
      const colors = new Float32Array(MAX_SPARKLES * 3);
      colors.fill(1.0);
      meshRef.current.instanceColor = new InstancedBufferAttribute(colors, 3);
    }
  }, []);

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    let n = 0;
    const count = sparklePool.length;

    for (let i = 0; i < count; i++) {
      const p = sparklePool[i];
      if (p.life <= 0) continue;
      if (n >= MAX_SPARKLES) break;

      // Pop and fade curve: rapidly expands on spawn, peaks, and smoothly shrinks away
      const pop = Math.sin(Math.min(1, Math.max(0, p.life)) * Math.PI);
      const scale = p.size * Math.pow(pop, 0.7);

      tmp.position.set(p.x, p.y, p.z);
      tmp.quaternion.copy(camera.quaternion);
      tmp.rotateZ(p.rot);
      tmp.scale.set(scale, scale, scale);
      tmp.updateMatrix();

      mesh.setMatrixAt(n, tmp.matrix);
      mesh.setColorAt(
        n,
        p.colorType === 0 ? COLOR_WHITE : p.colorType === 1 ? COLOR_GOLD : COLOR_PALE,
      );
      n++;
    }

    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_SPARKLES]}
      frustumCulled={false}
      renderOrder={999}
      onUpdate={(self) => {
        self.instanceMatrix.setUsage(DynamicDrawUsage);
        if (!self.instanceColor) {
          const colors = new Float32Array(MAX_SPARKLES * 3);
          colors.fill(1.0);
          self.instanceColor = new InstancedBufferAttribute(colors, 3);
        }
      }}
    />
  );
}
