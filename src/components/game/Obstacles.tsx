import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, Color, DynamicDrawUsage, InstancedBufferAttribute, InstancedMesh, Object3D } from 'three';
import { LANE_WIDTH, OBSTACLE_BOX_CAPACITY, SPAWN_AHEAD } from '../../game/constants';
import { OBSTACLE_PARTS, obstacleColor } from '../../game/obstacles';
import { getGameState, runtime } from '../../game/state';
import { createPropMaterial } from '../../utils/bendMaterial';

const tmp = new Object3D();
const tmpColor = new Color();

/** All obstacle boxes are drawn with one InstancedMesh (a single draw call). */
export function Obstacles() {
  const mesh = useMemo(() => {
    const m = new InstancedMesh(new BoxGeometry(1, 1, 1), createPropMaterial(), OBSTACLE_BOX_CAPACITY);
    m.instanceMatrix.setUsage(DynamicDrawUsage);
    m.instanceColor = new InstancedBufferAttribute(new Float32Array(OBSTACLE_BOX_CAPACITY * 3), 3);
    m.castShadow = false;
    m.receiveShadow = true;
    m.frustumCulled = false;
    m.count = 0;
    return m;
  }, []);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as { dispose(): void }).dispose();
      mesh.dispose();
    },
    [mesh],
  );

  useFrame(() => {
    const status = getGameState().status;
    if (status === 'home' || status === 'menu') {
      mesh.count = 0;
      mesh.instanceMatrix.needsUpdate = true;
      return;
    }

    let n = 0;
    for (const ob of runtime.obstacles) {
      const z = -(ob.d - runtime.distance);
      if (z > 14 || z < -(SPAWN_AHEAD + 20)) continue;
      const x = ob.lane * LANE_WIDTH;
      for (const part of OBSTACLE_PARTS[ob.type]) {
        if (n >= OBSTACLE_BOX_CAPACITY) break;
        tmp.position.set(x + part.offset[0], part.offset[1], z + part.offset[2]);
        tmp.scale.set(part.size[0], part.size[1], part.size[2]);
        tmp.updateMatrix();
        mesh.setMatrixAt(n, tmp.matrix);
        mesh.setColorAt(n, tmpColor.setHex(obstacleColor(ob.type, ob.variant, part.role)));
        n++;
      }
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <primitive object={mesh} />;
}
