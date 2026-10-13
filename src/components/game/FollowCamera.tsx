import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { CAMERA, MAX_SPEED, START_SPEED } from '../../game/constants';
import { getGameState, runtime } from '../../game/state';
import { clamp, damp } from '../../utils/math';

/** Smooth third-person chase camera; widens FOV with speed and adapts to portrait screens. */
export function FollowCamera() {
  const fov = useRef(60);

  useFrame(({ camera, size }, dt) => {
    const cam = camera as PerspectiveCamera;
    const aspect = size.width / size.height;
    const portrait = aspect < 0.9;
    const status = getGameState().status;
    const isMenu = status === 'menu';
    const isCrashed = runtime.crashed || status === 'gameover';
    const speedT = clamp((runtime.speed - START_SPEED) / (MAX_SPEED - START_SPEED), 0, 1);

    // In menu mode, frame the standing character proudly in front-view; in game, smooth third-person chase; when fallen, cinematic low framing
    const targetDistance = isMenu
      ? (portrait ? 6.4 : 5.6)
      : isCrashed
      ? (portrait ? 6.8 : 5.8)
      : CAMERA.distance + (portrait ? 1.8 : 0) + speedT * 0.8;
    const targetHeight = isMenu
      ? (portrait ? 2.1 : 1.9)
      : isCrashed
      ? (portrait ? 2.4 : 2.0)
      : CAMERA.height + (portrait ? 0.6 : 0);
    const targetLookHeight = isMenu
      ? 1.15
      : isCrashed
      ? 0.65
      : CAMERA.lookHeight + runtime.y * 0.3;
    const targetLookAhead = isMenu
      ? 0
      : isCrashed
      ? -1.2
      : CAMERA.lookAhead;

    cam.position.x = damp(cam.position.x, runtime.x * 0.65, 6, dt);
    cam.position.y = damp(cam.position.y, targetHeight + runtime.y * 0.35, isMenu || isCrashed ? 4 : 5, dt);
    cam.position.z = damp(cam.position.z, targetDistance, isMenu || isCrashed ? 4 : 3, dt);
    cam.lookAt(runtime.x * 0.4, targetLookHeight, targetLookAhead);

    const targetFov = isMenu ? (portrait ? 56 : 50) : (portrait ? 72 : 60) + speedT * 7;
    fov.current = damp(fov.current, targetFov, 3, dt);
    if (Math.abs(cam.fov - fov.current) > 0.05) {
      cam.fov = fov.current;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
