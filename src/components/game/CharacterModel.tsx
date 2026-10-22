import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { AnimationMixer, Box3, LoopOnce, LoopRepeat, Vector3 } from 'three';
import type { Group, Mesh, SkinnedMesh } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  CHARACTER_TARGET_HEIGHT,
  CHARACTER_URL,
  CHARACTER_YAW,
  RUN_ANIMATION_PATTERN,
  JUMP_ANIMATION_PATTERN,
  FLIP_ANIMATION_PATTERN,
  ROLL_ANIMATION_PATTERN,
  DIE_ANIMATION_PATTERN,
  FALL_ANIMATION_PATTERN,
  SLIDE_DURATION,
} from '../../game/constants';
import { getGameState, runtime } from '../../game/state';
import { damp } from '../../utils/math';

interface Props {
  /** Called when the model has no usable run clip so the parent can fall back to the placeholder. */
  onUnavailable?: () => void;
  /** Called when the model has successfully mounted and configured animations. */
  onLoaded?: () => void;
}

/**
 * Loads /character.glb, fits it so its feet touch the ground at y=0 and height matches
 * CHARACTER_TARGET_HEIGHT, and switches smoothly between run, jump, flip, roll, and die animations.
 */
export function CharacterModel({ onUnavailable, onLoaded }: Props) {
  const gltf = useGLTF(CHARACTER_URL);
  const group = useRef<Group>(null);
  const yawGroup = useRef<Group>(null);

  const fit = useMemo(() => {
    const object = cloneSkinned(gltf.scene);
    let skinnedMesh: SkinnedMesh | null = null;
    object.traverse((o) => {
      if ((o as Mesh).isMesh) {
        const mesh = o as Mesh;
        mesh.frustumCulled = false;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as any;
        if (mat) {
          if (typeof mat.roughness === 'number') {
            mat.roughness = 0.35; // vibrant polished arcade sheen matching reference
          }
          if (typeof mat.metalness === 'number') {
            mat.metalness = 0.12; // rich material definition & specular reflections
          }
          if (typeof mat.envMapIntensity === 'number') {
            mat.envMapIntensity = 1.35;
          }
        }
      }
      if ((o as SkinnedMesh).isSkinnedMesh) {
        skinnedMesh = o as SkinnedMesh;
      }
    });

    const box = new Box3();
    if (skinnedMesh && gltf.animations.length > 0) {
      // Pose skeleton with run animation to measure actual upright runner bounds
      const runClip =
        gltf.animations.find((a) => RUN_ANIMATION_PATTERN.test(a.name)) || gltf.animations[0];
      const tempMixer = new AnimationMixer(object);
      tempMixer.clipAction(runClip).play();
      tempMixer.update(0.001);
      object.updateMatrixWorld(true);
      (skinnedMesh as SkinnedMesh).skeleton.update();

      const pos = (skinnedMesh as SkinnedMesh).geometry.attributes.position;
      const v = new Vector3();
      const stride = Math.max(1, Math.floor(pos.count / 300));
      for (let i = 0; i < pos.count; i += stride) {
        (skinnedMesh as SkinnedMesh).getVertexPosition(i, v);
        v.applyMatrix4((skinnedMesh as SkinnedMesh).matrixWorld);
        box.expandByPoint(v);
      }
      tempMixer.stopAllAction();
      tempMixer.uncacheRoot(object);
    } else {
      object.updateMatrixWorld(true);
      box.setFromObject(object);
    }

    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const scale = size.y > 0 ? CHARACTER_TARGET_HEIGHT / size.y : 1;
    return {
      object,
      scale,
      offset: new Vector3(-centre.x * scale, -box.min.y * scale, -centre.z * scale),
    };
  }, [gltf]);

  const { actions, names, mixer } = useAnimations(gltf.animations, group);

  const idleNames = useMemo(
    () => names.filter((n) => /idle/i.test(n)),
    [names],
  );
  const runName = useMemo(
    () => names.find((n) => /^run$/i.test(n)) || names.find((n) => RUN_ANIMATION_PATTERN.test(n)),
    [names],
  );
  const jumpName = useMemo(
    () => names.find((n) => /^jump$/i.test(n)) || names.find((n) => JUMP_ANIMATION_PATTERN.test(n)),
    [names],
  );
  const flipName = useMemo(
    () => names.find((n) => /^flip$/i.test(n)) || names.find((n) => FLIP_ANIMATION_PATTERN.test(n)),
    [names],
  );
  const rollName = useMemo(
    () => names.find((n) => /^roll$/i.test(n)) || names.find((n) => ROLL_ANIMATION_PATTERN.test(n)),
    [names],
  );
  const speedrunName = useMemo(
    () => names.find((n) => /^speedrun$/i.test(n)) || names.find((n) => /speedrun|fastrun|sprint/i.test(n)),
    [names],
  );
  const fallName = useMemo(
    () =>
      names.find((n) => /^fall1$/i.test(n)) ||
      names.find((n) => /^fall$/i.test(n)) ||
      names.find((n) => /fallingdown/i.test(n)) ||
      names.find((n) => FALL_ANIMATION_PATTERN.test(n)) ||
      names.find((n) => /^die$/i.test(n)) ||
      names.find((n) => DIE_ANIMATION_PATTERN.test(n)),
    [names],
  );

  const activeAnimRef = useRef<string | null>(null);
  const lastRollCountRef = useRef<number>(0);
  const currentIdleRef = useRef<string>('');
  const idleTimerRef = useRef<number>(0);

  useEffect(() => {
    if (!runName) {
      console.warn('[CharacterModel] no "run" animation found in character.glb – using placeholder.');
      onUnavailable?.();
      return;
    }
    if (idleNames.length > 0 && !currentIdleRef.current) {
      const initial = idleNames[Math.floor(Math.random() * idleNames.length)];
      currentIdleRef.current = initial;
      const clipDur = actions[initial]?.getClip().duration || 4.5;
      idleTimerRef.current = clipDur <= 5 ? clipDur * (Math.random() > 0.4 ? 2 : 1) : Math.min(clipDur, 5 + Math.random() * 4);
    }
    onLoaded?.();
  }, [runName, idleNames, actions, onUnavailable, onLoaded]);

  useFrame((_, dt) => {
    if (getGameState().paused) {
      if (mixer && mixer.timeScale !== 0) mixer.timeScale = 0;
      return;
    }
    if (mixer && mixer.timeScale === 0) {
      mixer.timeScale = 1;
    }

    const status = getGameState().status;
    const isMenu = status === 'menu' || status === 'home';
    const isCrashed = runtime.crashed || status === 'gameover';
    const isJumping = !runtime.grounded && !isCrashed && !isMenu;
    const isRolling = runtime.grounded && runtime.sliding && !isCrashed && !isMenu;
    const isRunning = runtime.grounded && !runtime.sliding && !isCrashed && !isMenu;
    const isTurbo = runtime.turboTimer > 0 && !isCrashed && !isMenu;

    // Keep roll tracking synchronized whenever not actively sliding or in menu
    if (isMenu || !runtime.sliding) {
      lastRollCountRef.current = runtime.rollCount;
    }

    // Face the camera (yaw = 0) in menu; turn around (yaw = CHARACTER_YAW) when running
    if (yawGroup.current) {
      const targetYaw = isMenu ? 0 : CHARACTER_YAW;
      yawGroup.current.rotation.y = damp(yawGroup.current.rotation.y, targetYaw, isMenu ? 14 : 9, dt);
    }

    let desired: string | null = null;
    if (isMenu) {
      // Stand and cycle randomly between idle1, idle2, idle3, idle4...
      if (idleNames.length > 0) {
        idleTimerRef.current -= dt;
        if (idleTimerRef.current <= 0) {
          const pool =
            idleNames.length > 1
              ? idleNames.filter((n) => n !== currentIdleRef.current)
              : idleNames;
          const next = pool[Math.floor(Math.random() * pool.length)] || idleNames[0];
          currentIdleRef.current = next;
          const clip = actions[next]?.getClip();
          const clipDuration = clip?.duration || 4.5;
          // Shorter clips (idle2, idle3) play 1-2 loops; longer clips (idle1, idle4) play full or 6-12s
          const playDuration =
            clipDuration <= 5
              ? clipDuration * (Math.random() > 0.4 ? 2 : 1)
              : Math.min(clipDuration, 6 + Math.random() * 6);
          idleTimerRef.current = playDuration;
        }
        desired = currentIdleRef.current || idleNames[0];
      } else {
        desired = runName || null;
      }
    } else if (isCrashed) {
      desired = fallName || runName || null;
    } else if (isJumping) {
      if (runtime.isFlipping) {
        desired = flipName || jumpName || runName || null;
      } else {
        desired = jumpName || flipName || runName || null;
      }
    } else if (isRolling) {
      desired = isTurbo && speedrunName ? speedrunName : (rollName || runName || null);
    } else if (isRunning) {
      desired = isTurbo && speedrunName ? speedrunName : (runName || null);
    }

    const isNewRoll =
      isRolling &&
      Boolean(rollName) &&
      desired === rollName &&
      runtime.rollCount !== lastRollCountRef.current;

    if (isNewRoll) {
      lastRollCountRef.current = runtime.rollCount;
    }

    if (desired && (desired !== activeAnimRef.current || isNewRoll)) {
      const prevName = activeAnimRef.current;
      const nextName = desired;

      const prevAction = prevName ? actions[prevName] : null;
      const nextAction = nextName ? actions[nextName] : null;

      if (prevAction && prevAction !== nextAction) {
        prevAction.fadeOut(isMenu ? 0.35 : 0.12);
      }

      if (nextAction) {
        nextAction.reset();
        if (desired === fallName) {
          nextAction.setLoop(LoopOnce, 1);
          nextAction.clampWhenFinished = true;
          nextAction.fadeIn(0.12).play();
        } else if (desired === jumpName) {
          nextAction.setLoop(LoopOnce, 1);
          nextAction.clampWhenFinished = true;
          const clipDuration = nextAction.getClip().duration || 0.9;
          nextAction.timeScale = clipDuration / 0.95;
          nextAction.fadeIn(0.08).play();
        } else if (desired === flipName) {
          nextAction.setLoop(LoopOnce, 1);
          nextAction.clampWhenFinished = true;
          const clipDuration = nextAction.getClip().duration || 1.13;
          nextAction.timeScale = clipDuration / 1.1;
          nextAction.fadeIn(0.06).play();
        } else if (desired === rollName) {
          nextAction.setLoop(LoopOnce, 1);
          nextAction.clampWhenFinished = true;
          const clipDuration = nextAction.getClip().duration || 1.2;
          nextAction.timeScale = clipDuration / SLIDE_DURATION;
          if (isNewRoll && prevAction === nextAction) {
            // Already in roll animation – immediately restart from frame 0 at full weight
            nextAction.setEffectiveWeight(1);
            nextAction.play();
          } else {
            nextAction.fadeIn(0.08).play();
          }
        } else if (/idle/i.test(desired)) {
          // Smooth loop for standing idle animations (idle1, idle2, idle3, idle4)
          nextAction.setLoop(LoopRepeat, Infinity);
          nextAction.clampWhenFinished = false;
          nextAction.timeScale = 1.0;
          nextAction.fadeIn(0.35).play();
        } else {
          nextAction.fadeIn(0.12).play();
        }
      }

      activeAnimRef.current = desired;
    }

    // Dynamic speed matching while running in playing mode
    if (runName && actions[runName]) {
      const runAction = actions[runName];
      if (status === 'gameover' || runtime.crashed) {
        if (!fallName) runAction.paused = true;
      } else if (status === 'playing') {
        const totalSpeed = Math.hypot(runtime.speed, runtime.vx * 0.45);
        runAction.timeScale = 0.7 + totalSpeed / 20;
      }
    }
    if (speedrunName && actions[speedrunName]) {
      const speedAction = actions[speedrunName];
      if (status === 'gameover' || runtime.crashed) {
        speedAction.paused = true;
      } else if (status === 'playing') {
        speedAction.timeScale = 2.0; // high-octane hyper-speed sprint cycle
      }
    }
  });

  return (
    <group ref={yawGroup}>
      <group ref={group} position={fit.offset} scale={fit.scale}>
        <primitive object={fit.object} />
      </group>
    </group>
  );
}

useGLTF.preload(CHARACTER_URL);

