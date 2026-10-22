import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  MeshBasicMaterial,
  PointLight,
  Sprite,
  SpriteMaterial,
} from 'three';
import { runtime } from '../../game/state';

// ---------------------------------------------------------
// "THE FLASH" SPEED FORCE TRAIL + LIGHTNING SYSTEM
// One dynamic mesh (single draw call) holds every ribbon, bolt, arc and spark.
// ---------------------------------------------------------

const NUM_BOLTS = 2; // trailing lightning bolts
const NODES_PER_BOLT = 1;
const NUM_BRANCH_NODES = 2;
const NUM_ARCS = 2; // short crackles jumping around the body
const NODES_PER_ARC = 3;
const NUM_GROUND_BOLTS = 2; // discharge along the road
const NODES_PER_GROUND = 2;
const MAX_SPARKS = 22;

const TRAIL_POINTS = 24; // history samples per ribbon
const TRAIL_SPACING = 0.32; // world distance between samples (frame-rate independent)

const MAX_VERTS = 10000; // worst case is ~7.5k, writes are bounds-checked

const GAIN = .1; // overall brightness multiplier
const GLOW_WIDTH = 1.0; // soft halo pass width vs core
const GLOW_K = .5; // soft halo pass brightness vs core

// Speed Force palette
const C_WHITE = new Color('#ffffff');
const C_GOLD = new Color('#ffe600');
const C_AMBER = new Color('#ff7b00');
const C_CYAN = new Color('#00f0ff');
const C_DEEP_CYAN = new Color('#0077ff');

const SPARK_COLS = [C_WHITE, C_GOLD, C_AMBER, C_CYAN];
const BOLT_HEAD = [C_GOLD, C_CYAN, C_WHITE];
const BOLT_TAIL = [C_AMBER, C_DEEP_CYAN, C_GOLD];

// Where the wake ribbons attach to the runner (relative to runtime.x / runtime.y).
// Tuned for a ~1.5m tall character standing at y = 0.
interface TrailDef {
  ox: number;
  oy: number;
  width: number; // half-width at the runner
  pts: number; // how many history points are used (controls length)
  wobble: number; // electric shimmer amount along the tail
  gain: number;
  head: Color;
  tail: Color;
}
const TRAILS: TrailDef[] = [
  // Main spine tail: widest, longest, white-hot to amber
  { ox: 0, oy: 0.95, width: 0.17, pts: 24, wobble: 0.1, gain: 1.0, head: C_WHITE, tail: C_AMBER },
  // Hand streaks
  { ox: -0.34, oy: 0.9, width: 0.075, pts: 18, wobble: 0.08, gain: 0.85, head: C_GOLD, tail: C_AMBER },
  { ox: 0.34, oy: 0.9, width: 0.075, pts: 18, wobble: 0.08, gain: 0.85, head: C_GOLD, tail: C_AMBER },
  // Foot streaks: blue-white contrast
  { ox: -0.2, oy: 0.14, width: 0.055, pts: 14, wobble: 0.05, gain: 0.8, head: C_CYAN, tail: C_DEEP_CYAN },
  { ox: 0.2, oy: 0.14, width: 0.055, pts: 14, wobble: 0.05, gain: 0.8, head: C_CYAN, tail: C_DEEP_CYAN },
];

// [centerX, centerY, spreadX, spreadY] attachment zones on the body
const BODY: number[][] = [
  [0, 1.5, 0.25, 0.2], // head
  [-0.52, 1.1, 0.2, 0.4], // left hand / shoulder
  [0.52, 1.1, 0.2, 0.4], // right hand / shoulder
  [0, 1.15, 0.3, 0.3], // chest
  [-0.22, 0.18, 0.15, 0.2], // left foot
  [0.22, 0.18, 0.15, 0.2], // right foot
  [0, 0.65, 0.35, 0.25], // hips
];

interface Bolt {
  life: number;
  maxLife: number;
  color: number;
  n: Float32Array;
  hasBranch: boolean;
  branchIdx: number;
  br: Float32Array;
}
interface Arc {
  life: number;
  maxLife: number;
  color: number;
  n: Float32Array;
}
interface Ground {
  life: number;
  maxLife: number;
  side: number;
  n: Float32Array;
}
interface Spark {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}
interface State {
  bolts: Bolt[];
  arcs: Arc[];
  ground: Ground[];
  sparks: Spark[];
  trailX: Float32Array[];
  trailY: Float32Array[];
  acc: number;
  power: number;
  burst: number;
  wasTurbo: boolean;
  clock: number;
  sparkAcc: number;
}
interface Writer {
  pos: Float32Array;
  col: Float32Array;
  n: number;
}

const rr = (a: number, b: number) => a + Math.random() * (b - a);

// scratch values (no per-frame allocations)
const cA = new Color();
const cB = new Color();
let bpx = 0;
let bpy = 0;

function createState(): State {
  const bolts: Bolt[] = [];
  for (let i = 0; i < NUM_BOLTS; i++) {
    bolts.push({
      life: 0,
      maxLife: 0.06,
      color: 0,
      n: new Float32Array(NODES_PER_BOLT * 3),
      hasBranch: i % 2 === 0,
      branchIdx: 3,
      br: new Float32Array((NUM_BRANCH_NODES + 1) * 3),
    });
  }
  const arcs: Arc[] = [];
  for (let i = 0; i < NUM_ARCS; i++) {
    arcs.push({ life: 0, maxLife: 0.06, color: 1, n: new Float32Array(NODES_PER_ARC * 3) });
  }
  const ground: Ground[] = [];
  for (let i = 0; i < NUM_GROUND_BOLTS; i++) {
    ground.push({
      life: 0,
      maxLife: 0.05,
      side: i % 2 === 0 ? -1 : 1,
      n: new Float32Array(NODES_PER_GROUND * 3),
    });
  }
  const sparks: Spark[] = [];
  for (let i = 0; i < MAX_SPARKS; i++) {
    sparks.push({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.2,
      size: 0.04,
      color: 0,
    });
  }
  return {
    bolts,
    arcs,
    ground,
    sparks,
    trailX: TRAILS.map(() => new Float32Array(TRAIL_POINTS)),
    trailY: TRAILS.map(() => new Float32Array(TRAIL_POINTS)),
    acc: 0,
    power: 0,
    burst: 0,
    wasTurbo: false,
    clock: 0,
    sparkAcc: 0,
  };
}

// ---------------------------------------------------------
// Geometry writing helpers
// Each segment is drawn as a cross of two quads, so it reads from any camera angle.
// ---------------------------------------------------------

function pushVert(w: Writer, x: number, y: number, z: number, c: Color, k: number) {
  const i = w.n * 3;
  w.pos[i] = x;
  w.pos[i + 1] = y;
  w.pos[i + 2] = z;
  w.col[i] = c.r * k;
  w.col[i + 1] = c.g * k;
  w.col[i + 2] = c.b * k;
  w.n++;
}

function pushQuad(
  w: Writer,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  sx: number, sy: number, sz: number,
  wa: number, wb: number,
  ca: Color, cb: Color,
  ka: number, kb: number,
) {
  pushVert(w, ax + sx * wa, ay + sy * wa, az + sz * wa, ca, ka);
  pushVert(w, ax - sx * wa, ay - sy * wa, az - sz * wa, ca, ka);
  pushVert(w, bx + sx * wb, by + sy * wb, bz + sz * wb, cb, kb);
  pushVert(w, ax - sx * wa, ay - sy * wa, az - sz * wa, ca, ka);
  pushVert(w, bx - sx * wb, by - sy * wb, bz - sz * wb, cb, kb);
  pushVert(w, bx + sx * wb, by + sy * wb, bz + sz * wb, cb, kb);
}

function emitSeg(
  w: Writer,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  wa: number, wb: number,
  ca: Color, cb: Color,
  ka: number, kb: number,
) {
  if (w.n + 12 > MAX_VERTS || (ka <= 0.002 && kb <= 0.002)) return;
  let dx = bx - ax;
  let dy = by - ay;
  let dz = bz - az;
  const dl = Math.hypot(dx, dy, dz);
  if (dl < 1e-5) return;
  dx /= dl;
  dy /= dl;
  dz /= dl;

  // s1 = dir x up (horizontal side vector), s2 = dir x s1 (vertical-ish side vector)
  let s1x = -dz;
  let s1z = dx;
  const sl = Math.hypot(s1x, s1z);
  if (sl < 1e-3) {
    s1x = 1;
    s1z = 0;
  } else {
    s1x /= sl;
    s1z /= sl;
  }
  const s2x = dy * s1z;
  const s2y = dz * s1x - dx * s1z;
  const s2z = -dy * s1x;

  pushQuad(w, ax, ay, az, bx, by, bz, s1x, 0, s1z, wa, wb, ca, cb, ka * GAIN, kb * GAIN);
  pushQuad(w, ax, ay, az, bx, by, bz, s2x, s2y, s2z, wa, wb, ca, cb, ka * GAIN, kb * GAIN);
}

// Hot core + wider soft halo = cheap fake bloom
function emitBeam(
  w: Writer,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  wa: number, wb: number,
  ca: Color, cb: Color,
  ka: number, kb: number,
) {
  emitSeg(w, ax, ay, az, bx, by, bz, wa, wb, ca, cb, ka, kb);
  emitSeg(w, ax, ay, az, bx, by, bz, wa * GLOW_WIDTH, wb * GLOW_WIDTH, ca, cb, ka * GLOW_K, kb * GLOW_K);
}

// Draw a polyline stored as [x,y,z, x,y,z, ...] with an offset and head->tail gradient
function drawPath(
  w: Writer,
  p: Float32Array,
  count: number,
  ox: number,
  oy: number,
  w0: number,
  w1: number,
  head: Color,
  tail: Color,
  k: number,
  fade: number,
  hotHead: boolean,
) {
  for (let i = 0; i < count - 1; i++) {
    const tA = i / (count - 1);
    const tB = (i + 1) / (count - 1);
    cA.copy(i === 0 && hotHead ? C_WHITE : head).lerp(tail, tA);
    cB.copy(head).lerp(tail, tB);
    const i3 = i * 3;
    emitBeam(
      w,
      ox + p[i3], oy + p[i3 + 1], p[i3 + 2],
      ox + p[i3 + 3], oy + p[i3 + 4], p[i3 + 5],
      w0 + (w1 - w0) * tA,
      w0 + (w1 - w0) * tB,
      cA, cB,
      k * Math.pow(1 - tA, fade),
      k * Math.pow(1 - tB, fade),
    );
  }
}

// ---------------------------------------------------------
// Strike / spawn helpers
// ---------------------------------------------------------

function pickBody(i: number) {
  const a = BODY[i];
  bpx = a[0] + (Math.random() - 0.5) * a[2];
  bpy = a[1] + (Math.random() - 0.5) * a[3];
}

function strikeBolt(b: Bolt) {
  b.life = rr(0.04, 0.1);
  b.maxLife = b.life;
  pickBody(Math.floor(Math.random() * BODY.length));

  let x = bpx;
  let y = bpy;
  let z = rr(-0.1, 0.1);
  const n = b.n;
  n[0] = x;
  n[1] = y;
  n[2] = z;

  const r = Math.random();
  b.color = r < 0.62 ? 0 : r < 0.85 ? 1 : 2; // gold / cyan / white-hot

  const ang = (Math.random() - 0.5) * 0.9;
  const driftY = (Math.random() - 0.4) * 0.6;

  for (let i = 1; i < NODES_PER_BOLT; i++) {
    z += rr(0.45, 0.8); // trails backward (+Z)
    x += ang * 0.4 + (Math.random() - 0.5) * 0.5;
    y += driftY * 0.3 + (Math.random() - 0.5) * 0.45;
    if (y < 0.03) y = 0.03 + Math.random() * 0.1;
    n[i * 3] = x;
    n[i * 3 + 1] = y;
    n[i * 3 + 2] = z;

    if (b.hasBranch && i === b.branchIdx) {
      let bx = x;
      let by = y;
      let bz = z;
      const lateral = (Math.random() > 0.5 ? 1 : -1) * rr(0.35, 0.7);
      b.br[0] = bx;
      b.br[1] = by;
      b.br[2] = bz;
      for (let k = 1; k <= NUM_BRANCH_NODES; k++) {
        bz += rr(0.3, 0.55);
        bx += lateral + (Math.random() - 0.5) * 0.35;
        by += (Math.random() - 0.5) * 0.35;
        if (by < 0.03) by = 0.03;
        b.br[k * 3] = bx;
        b.br[k * 3 + 1] = by;
        b.br[k * 3 + 2] = bz;
      }
    }
  }
}

function strikeArc(a: Arc) {
  a.life = rr(0.05, 0.1);
  a.maxLife = a.life;
  const i0 = Math.floor(Math.random() * BODY.length);
  const i1 = (i0 + 1 + Math.floor(Math.random() * (BODY.length - 1))) % BODY.length;
  pickBody(i0);
  const x0 = bpx;
  const y0 = bpy;
  pickBody(i1);
  const x1 = bpx;
  const y1 = bpy;
  const r = Math.random();
  a.color = r < 0.4 ? 0 : r < 0.75 ? 1 : 2;
  for (let i = 0; i < NODES_PER_ARC; i++) {
    const t = i / (NODES_PER_ARC - 1);
    const env = Math.sin(Math.PI * t);
    const j = 0.16 * env;
    a.n[i * 3] = x0 + (x1 - x0) * t + rr(-j, j);
    a.n[i * 3 + 1] = y0 + (y1 - y0) * t + rr(-j, j);
    a.n[i * 3 + 2] = rr(-0.18, 0.18) * (0.4 + env);
  }
}

function strikeGround(g: Ground) {
  g.life = rr(0.03, 0.08);
  g.maxLife = g.life;
  let x = g.side * 0.22 + rr(-0.075, 0.075);
  let z = rr(-0.15, 0.15);
  g.n[0] = x;
  g.n[1] = 0.04;
  g.n[2] = z;
  for (let i = 1; i < NODES_PER_GROUND; i++) {
    z += rr(0.35, 0.65);
    x += g.side * rr(0.15, 0.4) + rr(-0.1, 0.1);
    g.n[i * 3] = x;
    g.n[i * 3 + 1] = 0.04;
    g.n[i * 3 + 2] = z;
  }
}

function spawnSpark(p: Spark, base: number, rx: number, ry: number) {
  p.active = true;
  p.x = rx + rr(-0.4, 0.4);
  p.y = ry + rr(0.1, 1.6);
  p.z = rr(-0.25, 0.15);
  p.vx = rr(-3.5, 3.5);
  p.vy = rr(-2.5, 2.5);
  p.vz = base * rr(0.9, 2.0);
  p.maxLife = rr(0.12, 0.26);
  p.life = p.maxLife;
  p.size = rr(0.025, 0.055);
  p.color = Math.floor(Math.random() * SPARK_COLS.length);
}

const flashK = (ratio: number) => 0.4 + 0.6 * Math.min(1, ratio * 2);

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------

export function LightningSparks() {
  const lightRef = useRef<PointLight>(null);
  const stateRef = useRef<State | null>(null);
  if (!stateRef.current) stateRef.current = createState();

  // Single dynamic mesh for ribbons + bolts + arcs + sparks
  const fx = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(MAX_VERTS * 3);
    const col = new Float32Array(MAX_VERTS * 3);
    const pa = new BufferAttribute(pos, 3);
    const ca = new BufferAttribute(col, 3);
    pa.setUsage(DynamicDrawUsage);
    ca.setUsage(DynamicDrawUsage);
    geo.setAttribute('position', pa);
    geo.setAttribute('color', ca);
    geo.setDrawRange(0, 0);
    const mat = new MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
      fog: false,
    });
    const writer: Writer = { pos, col, n: 0 };
    return { geo, mat, pa, ca, writer };
  }, []);

  // Soft energy halo behind the runner
  const glow = useMemo(() => {
    const tex = makeGlowTexture();
    const mat = new SpriteMaterial({
      map: tex,
      color: C_GOLD,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      opacity: 0,
      fog: false,
    });
    const sprite = new Sprite(mat);
    sprite.visible = false;
    sprite.frustumCulled = false;
    sprite.renderOrder = 9;
    return { tex, mat, sprite };
  }, []);

  useEffect(() => {
    return () => {
      fx.geo.dispose();
      fx.mat.dispose();
      glow.tex.dispose();
      glow.mat.dispose();
    };
  }, [fx, glow]);

  useFrame((_, rawDt) => {
    const s = stateRef.current!;
    const dt = Math.min(rawDt, 0.05);
    const w = fx.writer;
    const light = lightRef.current;

    const isTurbo = runtime.turboTimer > 0 && !runtime.crashed;
    s.clock += dt;

    // Smooth fade in / out so the effect never pops on or off
    const target = isTurbo ? 1 : 0;
    s.power += (target - s.power) * (1 - Math.exp(-(isTurbo ? 14 : 8) * dt));

    if (!isTurbo && s.power < 0.01) {
      s.power = 0;
      s.wasTurbo = false;
      w.n = 0;
      fx.geo.setDrawRange(0, 0);
      glow.sprite.visible = false;
      if (light) light.intensity = 0;
      for (let i = 0; i < s.sparks.length; i++) s.sparks[i].active = false;
      return;
    }

    const pw = s.power;
    const rx = runtime.x;
    const ry = runtime.y;
    const base = Math.max(16.0, runtime.speed);
    const drift = base * dt;
    const clock = s.clock;

    // -----------------------------------------------------
    // Turbo start: reset trails and trigger an energy burst
    // -----------------------------------------------------
    if (isTurbo && !s.wasTurbo) {
      s.wasTurbo = true;
      s.burst = 1;
      s.acc = 0;
      s.sparkAcc += 22;
      for (let r = 0; r < TRAILS.length; r++) {
        s.trailX[r].fill(rx + TRAILS[r].ox);
        s.trailY[r].fill(ry + TRAILS[r].oy);
      }
      for (const b of s.bolts) b.life = 0;
      for (const a of s.arcs) a.life = 0;
      for (const g of s.ground) g.life = 0;
    } else if (!isTurbo) {
      s.wasTurbo = false;
    }
    s.burst = Math.max(0, s.burst - dt * 3.5);

    // -----------------------------------------------------
    // A. TRAIL HISTORY (sampled by distance, not by frame)
    // -----------------------------------------------------
    s.acc += drift;
    while (s.acc >= TRAIL_SPACING) {
      s.acc -= TRAIL_SPACING;
      for (let r = 0; r < TRAILS.length; r++) {
        const hx = s.trailX[r];
        const hy = s.trailY[r];
        hx.copyWithin(2, 1, TRAIL_POINTS - 1);
        hy.copyWithin(2, 1, TRAIL_POINTS - 1);
        hx[1] = rx + TRAILS[r].ox + (Math.random() - 0.5) * 0.05;
        hy[1] = ry + TRAILS[r].oy + (Math.random() - 0.5) * 0.05;
      }
    }

    // -----------------------------------------------------
    // B. BUILD GEOMETRY
    // -----------------------------------------------------
    w.n = 0;

    // Wake ribbons
    for (let r = 0; r < TRAILS.length; r++) {
      const T = TRAILS[r];
      const hx = s.trailX[r];
      const hy = s.trailY[r];
      const ax = rx + T.ox;
      const ay = ry + T.oy;
      const last = T.pts - 1;
      const flick = 0.85 + 0.15 * Math.sin(clock * 55 + r * 3.1);

      for (let i = 0; i < last; i++) {
        const tA = i / last;
        const tB = (i + 1) / last;
        const gA = tA * T.wobble;
        const gB = tB * T.wobble;

        const xa = (i === 0 ? ax : hx[i]) + Math.sin(clock * 38 + i * 1.9 + r * 2.3) * gA;
        const ya = Math.max(0.02, (i === 0 ? ay : hy[i]) + Math.cos(clock * 33 + i * 2.1 + r * 1.7) * gA * 0.6);
        const za = i === 0 ? 0 : s.acc + (i - 1) * TRAIL_SPACING;

        const xb = hx[i + 1] + Math.sin(clock * 38 + (i + 1) * 1.9 + r * 2.3) * gB;
        const yb = Math.max(0.02, hy[i + 1] + Math.cos(clock * 33 + (i + 1) * 2.1 + r * 1.7) * gB * 0.6);
        const zb = s.acc + i * TRAIL_SPACING;

        cA.copy(T.head).lerp(T.tail, tA);
        cB.copy(T.head).lerp(T.tail, tB);

        emitBeam(
          w, xa, ya, za, xb, yb, zb,
          T.width * (1 - 0.88 * tA) + 0.006,
          T.width * (1 - 0.88 * tB) + 0.006,
          cA, cB,
          Math.pow(1 - tA, 1.5) * pw * flick * T.gain,
          Math.pow(1 - tB, 1.5) * pw * flick * T.gain,
        );
      }
    }

    // Trailing jagged bolts + forks
    for (let i = 0; i < s.bolts.length; i++) {
      const b = s.bolts[i];
      b.life -= dt;
      let struck = false;
      if (b.life <= 0 && isTurbo) {
        strikeBolt(b);
        struck = true;
      }
      if (b.life <= 0) continue;

      if (!struck) {
        // crackle jitter while alive
        for (let n = 1; n < NODES_PER_BOLT; n++) {
          b.n[n * 3] += (Math.random() - 0.5) * 0.04;
          b.n[n * 3 + 1] += (Math.random() - 0.5) * 0.04;
          b.n[n * 3 + 2] += drift * 0.15;
        }
      }

      const k = pw * flashK(b.life / b.maxLife);
      drawPath(w, b.n, NODES_PER_BOLT, rx, ry, 0.07, 0.012, BOLT_HEAD[b.color], BOLT_TAIL[b.color], k, 1.2, true);

      if (b.hasBranch) {
        const bi = b.branchIdx * 3;
        b.br[0] = b.n[bi];
        b.br[1] = b.n[bi + 1];
        b.br[2] = b.n[bi + 2];
        drawPath(w, b.br, NUM_BRANCH_NODES + 1, rx, ry, 0.04, 0.008, BOLT_HEAD[b.color], BOLT_TAIL[b.color], k * 0.85, 1.0, false);
      }
    }

    // Short crackles arcing around the body
    for (let i = 0; i < s.arcs.length; i++) {
      const a = s.arcs[i];
      a.life -= dt;
      if (a.life <= 0 && isTurbo) strikeArc(a);
      if (a.life <= 0) continue;
      const k = pw * flashK(a.life / a.maxLife) * 0.9;
      drawPath(w, a.n, NODES_PER_ARC, rx, ry, 0.028, 0.028, BOLT_HEAD[a.color], BOLT_TAIL[a.color], k, 0, false);
    }

    // Road surface discharge
    for (let i = 0; i < s.ground.length; i++) {
      const g = s.ground[i];
      g.life -= dt;
      let struck = false;
      if (g.life <= 0 && isTurbo) {
        strikeGround(g);
        struck = true;
      }
      if (g.life <= 0) continue;
      if (!struck) {
        for (let n = 0; n < NODES_PER_GROUND; n++) g.n[n * 3 + 2] += drift * 0.2;
      }
      const k = pw * flashK(g.life / g.maxLife);
      drawPath(w, g.n, NODES_PER_GROUND, rx, 0, 0.065, 0.01, C_WHITE, C_AMBER, k, 1.0, false);
    }

    // Sparks: streaks shooting backward past the camera
    if (isTurbo) {
      s.sparkAcc += dt * (240 + s.burst * 900);
      let want = Math.floor(s.sparkAcc);
      s.sparkAcc -= want;
      for (let j = 0; j < s.sparks.length && want > 0; j++) {
        if (!s.sparks[j].active) {
          spawnSpark(s.sparks[j], base, rx, ry);
          want--;
        }
      }
    }
    for (let i = 0; i < s.sparks.length; i++) {
      const p = s.sparks[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt + (Math.random() - 0.5) * 0.12;
      p.y += p.vy * dt + (Math.random() - 0.5) * 0.12;
      p.z += p.vz * dt;
      if (p.y < 0.02) {
        p.y = 0.02;
        p.vy = Math.abs(p.vy) * 0.4;
      }
      const pr = p.life / p.maxLife;
      cA.copy(SPARK_COLS[p.color]);
      cB.copy(C_AMBER);
      emitBeam(
        w,
        p.x, p.y, p.z,
        p.x - p.vx * 0.03, p.y - p.vy * 0.03, p.z - p.vz * 0.03,
        p.size * pr, p.size * 0.15 * pr,
        cA, cB,
        pr * pw * 1.1, pr * pw * 0.25,
      );
    }

    fx.pa.needsUpdate = true;
    fx.ca.needsUpdate = true;
    fx.geo.setDrawRange(0, w.n);

    // -----------------------------------------------------
    // C. HALO SPRITE + FLICKERING SPEED FORCE LIGHT
    // -----------------------------------------------------
    glow.sprite.visible = true;
    glow.sprite.position.set(rx, ry + 0.85, -0.3); // just behind the runner so the model occludes the center
    const gs = 2.5 + Math.sin(clock * 30) * 0.12 + s.burst * 1.2;
    glow.sprite.scale.set(gs, gs * 1.3, 1);
    glow.mat.color.copy(Math.random() < 0.18 ? C_CYAN : C_GOLD);
    glow.mat.opacity = pw * (0.26 + Math.random() * 0.1 + s.burst * 0.3);

    if (light) {
      light.position.set(rx, ry + 0.9, 0.3);
      light.intensity = (4.0 + Math.random() * 4.5 + s.burst * 6) * pw;
      light.color.copy(Math.random() < 0.22 ? C_CYAN : C_GOLD);
    }
  });

  return (
    <group>
      {/* High-voltage Speed Force flickering dynamic light */}
      <pointLight ref={lightRef} color="#ffe600" distance={10} intensity={0} />

      {/* Soft energy halo behind the runner */}
      <primitive object={glow.sprite} />

      {/* Ribbons, bolts, arcs and sparks in one dynamic mesh */}
      <mesh geometry={fx.geo} material={fx.mat} frustumCulled={false} renderOrder={10} />
    </group>
  );
}