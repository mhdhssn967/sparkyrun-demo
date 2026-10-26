export type GameStatus = 'home' | 'menu' | 'playing' | 'gameover';
export type Lane = -1 | 0 | 1;
export type GameAction = 'left' | 'right' | 'jump' | 'slide';

export type ObstacleType = 'low' | 'overhead' | 'wall';
export type ColorRole = 'primary' | 'secondary' | 'dark';

export interface Obstacle {
  id: number;
  type: ObstacleType;
  lane: Lane;
  /** World distance (metres along the road) of the obstacle centre. */
  d: number;
  variant: number;
}

/** An axis-aligned box that makes up (part of) an obstacle. */
export interface BoxPart {
  offset: readonly [number, number, number];
  size: readonly [number, number, number];
  role: ColorRole;
  solid: boolean;
}

export type InstanceKind = 'box' | 'cylinder' | 'cone' | 'sphere' | 'lamp';

export type BannerKind = 'bannerA' | 'bannerB' | 'flagQatar' | 'productBillboard';

export interface BannerInstance {
  kind: BannerKind;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
  uvOffset?: readonly [number, number];
}

/** One decorative instance inside a procedurally generated chunk (chunk-local space). */
export interface ChunkInstance {
  kind: InstanceKind;
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
  color: number;
  rotation?: readonly [number, number, number];
}

export interface ChunkOutput {
  instances: ChunkInstance[];
  banners: BannerInstance[];
}

export interface Crystal {
  id: number;
  lane: Lane;
  d: number;
  y: number;
  collected: boolean;
  collectAnim: number;
  counted?: boolean;
  pickupX?: number;
  pickupY?: number;
  pickupZ?: number;
  currentX?: number;
  currentY?: number;
  currentZ?: number;
  currentScale?: number;
  attracted?: boolean;
  pullX?: number;
  pullY?: number;
  pullZ?: number;
}

export interface MagnetItem {
  id: number;
  lane: Lane;
  d: number;
  y: number;
  collected: boolean;
  collectAnim: number;
}

export interface PowerupItem {
  id: number;
  lane: Lane;
  d: number;
  y: number;
  collected: boolean;
  collectAnim: number;
}

export interface LuluGiftItem {
  id: number;
  lane: Lane;
  d: number;
  y: number;
  collected: boolean;
  collectAnim: number;
  voucherToken?: string;
}

/** Mutable per-frame simulation state (kept out of React for performance). */
export interface RuntimeState {
  /** Total distance travelled (never reset, so the world never pops). */
  distance: number;
  /** Distance at which the current run started. */
  runStart: number;
  speed: number;
  x: number;
  vx: number;
  targetLane: Lane;
  y: number;
  vy: number;
  grounded: boolean;
  canDoubleJump: boolean;
  isFlipping: boolean;
  flipHangTimer: number;
  sliding: boolean;
  slideTimer: number;
  slideQueued: boolean;
  rollCount: number;
  crashed: boolean;
  fallTimer: number;
  time: number;
  magnetTimer: number;
  turboTimer: number;
  obstacles: Obstacle[];
  crystals: Crystal[];
  magnets: MagnetItem[];
  powerups: PowerupItem[];
  luluGifts: LuluGiftItem[];
}

