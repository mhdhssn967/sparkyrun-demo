import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  RingGeometry,
  Shape,
} from 'three';
import { LANE_WIDTH, SPAWN_AHEAD } from '../../game/constants';
import { getGameState, runtime } from '../../game/state';
import { applyBend } from '../../utils/bendMaterial';

const MAX_POWERUPS = 4;
// Procedural bolt is ~0.5 units tall; scaling by 2 brings it to ~1.0m tall
const POWERUP_SCALE = 2;

const ARC_COUNT = 6;
const ARC_SEGMENTS = 9;
const SPARK_COUNT = 14;

// Lightning bolt outline (x, y), roughly centered on the origin
const BOLT_POINTS: [number, number][] = [
  [0.04, 0.25],
  [-0.12, -0.03],
  [-0.015, -0.03],
  [-0.06, -0.25],
  [0.12, 0.05],
  [0.015, 0.05],
  [0.1, 0.25],
];

type ArcState = {
  line: Line;
  attr: BufferAttribute;
  tick: number;
  crawl: boolean;
};

type PowerupFx = {
  root: Group;
  arcs: ArcState[];
  sparks: Points;
  sparkPos: BufferAttribute;
  sparkCol: BufferAttribute;
  geometries: BufferGeometry[];
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function buildBoltGeometry() {
  const shape = new Shape();
  shape.moveTo(BOLT_POINTS[0][0], BOLT_POINTS[0][1]);
  for (let i = 1; i < BOLT_POINTS.length; i++) {
    shape.lineTo(BOLT_POINTS[i][0], BOLT_POINTS[i][1]);
  }
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.03);
  return geo;
}

// Re-randomise one jagged electric arc
function rerollArc(arc: ArcState) {
  const pos = arc.attr.array as Float32Array;
  const a = BOLT_POINTS[Math.floor(Math.random() * BOLT_POINTS.length)];
  let sx = a[0];
  let sy = a[1];
  let sz = 0;
  let ex = 0;
  let ey = 0;
  let ez = 0;

  if (arc.crawl) {
    // Crawls across the bolt surface between two corners
    let b = BOLT_POINTS[Math.floor(Math.random() * BOLT_POINTS.length)];
    if (b === a) b = BOLT_POINTS[(BOLT_POINTS.indexOf(a) + 3) % BOLT_POINTS.length];
    ex = b[0];
    ey = b[1];
    sz = ez = (Math.random() < 0.5 ? -1 : 1) * 0.05;
  } else {
    // Leaps outward from the bolt into the air
    const ang = Math.random() * Math.PI * 2;
    const r = rand(0.2, 0.4);
    ex = sx + Math.cos(ang) * r;
    ey = sy + Math.sin(ang) * r * 0.9;
    ez = Math.sin(ang * 1.7) * r * 0.7;
    sz = rand(-0.04, 0.04);
  }

  const jitter = arc.crawl ? 0.035 : 0.08;
  for (let s = 0; s < ARC_SEGMENTS; s++) {
    const t = s / (ARC_SEGMENTS - 1);
    const env = Math.sin(Math.PI * t); // endpoints stay pinned
    const j = env * jitter;
    pos[s * 3] = sx + (ex - sx) * t + rand(-j, j);
    pos[s * 3 + 1] = sy + (ey - sy) * t + rand(-j, j);
    pos[s * 3 + 2] = sz + (ez - sz) * t + rand(-j, j);
  }
  arc.attr.needsUpdate = true;
}

export function Powerups() {
  const groupsRef = useRef<(Group | null)[]>([]);
  const aurasRef = useRef<(Mesh | null)[]>([]);

  // ---------- Shared materials ----------
  const boltMat = useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: '#fff3a0',
      roughness: 0.35,
      metalness: 0.2,
      emissive: '#ffe600',
      emissiveIntensity: 1.5,
      side: DoubleSide,
    });
    return applyBend(mat, 'powerup-bolt-mat');
  }, []);

  const glowMat = useMemo(() => {
    const mat = new MeshBasicMaterial({
      color: 0xffd23a,
      transparent: true,
      opacity: 0.35,
      blending: AdditiveBlending,
      side: BackSide,
      depthWrite: false,
    });
    return applyBend(mat, 'powerup-glow-mat');
  }, []);

  const arcMat = useMemo(() => {
    const mat = new LineBasicMaterial({
      color: 0xfffbd0,
      transparent: true,
      opacity: 0.95,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    return applyBend(mat, 'powerup-arc-mat');
  }, []);

  const sparkMat = useMemo(() => {
    const mat = new PointsMaterial({
      size: 0.07,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    return applyBend(mat, 'powerup-spark-mat');
  }, []);

  // ---------- Shared geometry ----------
  const boltGeo = useMemo(() => buildBoltGeometry(), []);

  // Persistent pool of procedural lightning pickups
  const models = useMemo<PowerupFx[]>(() => {
    return Array.from({ length: MAX_POWERUPS }).map(() => {
      const root = new Group();
      const geometries: BufferGeometry[] = [];

      // Solid bolt
      const bolt = new Mesh(boltGeo, boltMat);
      bolt.castShadow = false;
      bolt.receiveShadow = false;
      root.add(bolt);

      // Soft glow shell
      const glow = new Mesh(boltGeo, glowMat);
      glow.scale.set(1.18, 1.12, 1.9);
      root.add(glow);

      // Electric arcs
      const arcs: ArcState[] = [];
      for (let i = 0; i < ARC_COUNT; i++) {
        const geo = new BufferGeometry();
        const attr = new BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3);
        geo.setAttribute('position', attr);
        geometries.push(geo);
        const line = new Line(geo, arcMat);
        line.frustumCulled = false;
        root.add(line);
        const arc: ArcState = { line, attr, tick: -1, crawl: i % 2 === 0 };
        rerollArc(arc);
        arcs.push(arc);
      }

      // Sparks
      const sparkGeo = new BufferGeometry();
      const sparkPos = new BufferAttribute(new Float32Array(SPARK_COUNT * 3), 3);
      const sparkCol = new BufferAttribute(new Float32Array(SPARK_COUNT * 3), 3);
      sparkGeo.setAttribute('position', sparkPos);
      sparkGeo.setAttribute('color', sparkCol);
      geometries.push(sparkGeo);
      const sparks = new Points(sparkGeo, sparkMat);
      sparks.frustumCulled = false;
      root.add(sparks);

      return { root, arcs, sparks, sparkPos, sparkCol, geometries };
    });
  }, [boltGeo, boltMat, glowMat, arcMat, sparkMat]);

  // Glowing electric energy ground halo ring
  const auraGeo = useMemo(() => new RingGeometry(0.55, 0.95, 32), []);
  const auraMat = useMemo(() => {
    const mat = new MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.75,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthWrite: false,
    });
    return applyBend(mat, 'powerup-aura-bend');
  }, []);

  useEffect(() => {
    return () => {
      auraGeo.dispose();
      auraMat.dispose();
      boltGeo.dispose();
      boltMat.dispose();
      glowMat.dispose();
      arcMat.dispose();
      sparkMat.dispose();
      models.forEach((m) => m.geometries.forEach((g) => g.dispose()));
    };
  }, [auraGeo, auraMat, boltGeo, boltMat, glowMat, arcMat, sparkMat, models]);

  // Animate arcs + sparks of one pooled powerup
  const animateFx = (fx: PowerupFx, time: number, seed: number) => {
    // Arcs: re-roll ~20x per second, with random flicker-off
    const tick = Math.floor(time * 20 + seed * 7);
    for (let i = 0; i < fx.arcs.length; i++) {
      const arc = fx.arcs[i];
      if (arc.tick !== tick) {
        arc.tick = tick;
        rerollArc(arc);
        arc.line.visible = (tick * 7 + i * 3) % 5 !== 0;
      }
    }

    // Sparks: drift outward, fade and twinkle
    const pos = fx.sparkPos.array as Float32Array;
    const col = fx.sparkCol.array as Float32Array;
    for (let i = 0; i < SPARK_COUNT; i++) {
      const phase = (time * 1.6 + i / SPARK_COUNT + seed) % 1;
      const ang = i * 2.399 + time * 2.0;
      const r = 0.12 + phase * 0.38;
      pos[i * 3] = Math.cos(ang) * r;
      pos[i * 3 + 1] = Math.sin(i * 5.1) * 0.22 + (phase - 0.5) * 0.12;
      pos[i * 3 + 2] = Math.sin(ang) * r * 0.8;

      const fade = (1 - phase) * (0.5 + 0.5 * Math.sin(time * 40 + i * 3.7));
      col[i * 3] = fade;
      col[i * 3 + 1] = fade * 0.95;
      col[i * 3 + 2] = fade * 0.55;
    }
    fx.sparkPos.needsUpdate = true;
    fx.sparkCol.needsUpdate = true;
  };

  useFrame(() => {
    const status = getGameState().status;
    if (status === 'home' || status === 'menu') {
      for (let i = 0; i < MAX_POWERUPS; i++) {
        const grp = groupsRef.current[i];
        if (grp) grp.visible = false;
      }
      return;
    }

    const time = runtime.time;
    const powerups = runtime.powerups;
    let renderedCount = 0;

    // Electric pulse on the shared materials
    boltMat.emissiveIntensity = 1.4 + Math.sin(time * 18) * 0.35;
    glowMat.opacity = 0.3 + Math.sin(time * 11) * 0.08;

    for (let i = 0; i < powerups.length; i++) {
      const p = powerups[i];
      const z = -(p.d - runtime.distance);

      if (z > 14 || z < -(SPAWN_AHEAD + 10)) continue;
      if (renderedCount >= MAX_POWERUPS) break;

      const grp = groupsRef.current[renderedCount];
      const aura = aurasRef.current[renderedCount];

      if (grp) {
        grp.visible = true;
        const x = p.lane * LANE_WIDTH;
        const bobY = Math.sin(time * 4.2 + p.d * 0.4) * 0.16;

        if (p.collected) {
          // Rapid collection pop and upward warp lift
          const popScale = Math.max(0, p.collectAnim) * POWERUP_SCALE * 1.4;
          const popLift = (1.0 - p.collectAnim) * 1.5;
          grp.position.set(x, p.y + bobY + popLift, z);
          grp.scale.set(popScale, popScale, popScale);
          if (aura) aura.visible = false;
        } else {
          grp.position.set(x, p.y + bobY, z);
          grp.scale.set(POWERUP_SCALE, POWERUP_SCALE, POWERUP_SCALE);

          // Fast high-voltage rotation around Y axis
          const spinY = time * 3.6 + p.d * 0.3;
          // Upright tilt showing thunderbolt geometry clearly to player
          grp.rotation.set(0.18, spinY, 0);

          if (aura) {
            aura.visible = true;
            aura.position.set(x, 0.08, z);
            const pulse = 1.0 + Math.sin(time * 6.5) * 0.12;
            aura.scale.set(pulse, pulse, 1);
            aura.rotation.z = time * 2.2;
          }
        }

        animateFx(models[renderedCount], time, renderedCount * 0.37);
        renderedCount++;
      }
    }

    // Hide any unused pooled groups
    for (let i = renderedCount; i < MAX_POWERUPS; i++) {
      const grp = groupsRef.current[i];
      const aura = aurasRef.current[i];
      if (grp) grp.visible = false;
      if (aura) aura.visible = false;
    }
  });

  return (
    <group>
      {models.map((model, idx) => (
        <group key={`powerup-pooled-${idx}`}>
          {/* Ground electric energy halo */}
          <mesh
            ref={(el) => {
              aurasRef.current[idx] = el;
            }}
            geometry={auraGeo}
            material={auraMat}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          />
          {/* Procedural thunderbolt container */}
          <group
            ref={(el) => {
              groupsRef.current[idx] = el;
            }}
            visible={false}
          >
            <primitive object={model.root} />
          </group>
        </group>
      ))}
    </group>
  );
}