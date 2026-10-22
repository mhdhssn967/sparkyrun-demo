import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial, PlaneGeometry } from 'three';
import type { Mesh } from 'three';
import { CHUNK_COUNT, CHUNK_LENGTH, COLORS, ROAD_HALF_WIDTH } from '../../game/constants';
import { runtime } from '../../game/state';
import { applyBend } from '../../utils/bendMaterial';
import { positiveMod } from '../../utils/math';
import { createRoadTexture } from '../../utils/textures';

/** Road tiles + desert ground. Tiles are identical, so recycling is just a positional wrap. */
export function Road() {
  const tiles = useRef<(Mesh | null)[]>([]);

  const { roadGeo, groundGeo, roadMat, groundMat, texture } = useMemo(() => {
    // Subdivided along z: the bend is applied per-vertex, so long flat quads would not curve.
    const roadGeo = new PlaneGeometry(ROAD_HALF_WIDTH * 2, CHUNK_LENGTH, 1, CHUNK_LENGTH / 2);
    roadGeo.rotateX(-Math.PI / 2);
    roadGeo.translate(0, 0.01, -CHUNK_LENGTH / 2);
    const groundGeo = new PlaneGeometry(1400, 460, 1, 92);
    groundGeo.rotateX(-Math.PI / 2);
    groundGeo.translate(0, -0.08, -190);
    const texture = createRoadTexture();
    return {
      roadGeo,
      groundGeo,
      texture,
      roadMat: applyBend(new MeshStandardMaterial({
        map: texture,
        roughness: 0.76,
        metalness: 0.04,
      })),
      groundMat: applyBend(new MeshStandardMaterial({
        color: COLORS.sand,
        roughness: 0.88,
        metalness: 0.02,
      })),
    };
  }, []);

  useEffect(
    () => () => {
      roadGeo.dispose();
      groundGeo.dispose();
      roadMat.dispose();
      groundMat.dispose();
      texture.dispose();
    },
    [roadGeo, groundGeo, roadMat, groundMat, texture],
  );

  useFrame(() => {
    const base = Math.floor(runtime.distance / CHUNK_LENGTH) - 1;
    for (let k = 0; k < CHUNK_COUNT; k++) {
      const w = base + k;
      const tile = tiles.current[positiveMod(w, CHUNK_COUNT)];
      if (tile) tile.position.z = -(w * CHUNK_LENGTH - runtime.distance);
    }
  });

  return (
    <group>
      <mesh geometry={groundGeo} material={groundMat} receiveShadow frustumCulled={false} />
      {Array.from({ length: CHUNK_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            tiles.current[i] = m;
          }}
          geometry={roadGeo}
          material={roadMat}
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
