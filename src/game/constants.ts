// ---- Road layout -----------------------------------------------------------
export const LANE_WIDTH = 2.6;
export const ROAD_HALF_WIDTH = 6.6;
export const CHUNK_LENGTH = 60; // metres per recycled world chunk
export const CHUNK_COUNT = 6; // chunks alive at once (~360 m of world)

// ---- Movement --------------------------------------------------------------
export const MENU_SPEED = 0; // standing still in menu before starting
export const START_SPEED = 16;
export const MAX_SPEED = 30;
export const SPEED_RAMP = 0.05; // m/s gained per metre travelled
export const LANE_SMOOTHING = 16;
export const GRAVITY = 23;
export const JUMP_VELOCITY = 11.0; // peak ≈ 2.65 m, airtime ≈ 1.05 s
export const DOUBLE_JUMP_VELOCITY = 5.8; // dynamic upward lift into flip (adds ~0.75m arc)
export const FAST_FALL_VELOCITY = -22;
export const SLIDE_DURATION = 0.75;

// ---- Player hit box --------------------------------------------------------
export const PLAYER_HALF_WIDTH = 0.32;
export const PLAYER_HALF_DEPTH = 0.345;
export const PLAYER_HEIGHT = 2.01;
export const PLAYER_SLIDE_HEIGHT = 0.8;

// ---- Obstacles -------------------------------------------------------------
export const SPAWN_AHEAD = 175;
export const FIRST_OBSTACLE_DISTANCE = 70;
export const OBSTACLE_BOX_CAPACITY = 220;

// ---- Visuals ---------------------------------------------------------------
export const COLORS = {
  maroon: 0x8a1538,
  maroonDark: 0x5e0f27,
  white: 0xfcf9f4,
  sand: 0xdfbe8c,
  sandLight: 0xfae2be,
  sandDark: 0xb8956a,
  stone: 0xe9dfcd,
  charcoal: 0x2b2d33,
  turquoise: 0x17c0b8,
  gold: 0xedb847,
  palm: 0x2e943c,
  palmLight: 0x44b248,
  trunk: 0x7a5a3a,
  horizon: 0xfef3e4,
  skyTop: 0x1683e8,
  sun: 0xfff6e8,
} as const;

export const FOG_NEAR = 75;
export const FOG_FAR = 250;

/** Everything beyond this view-space distance is bent down/sideways (see bendMaterial). */
export const BEND_START = 9;
export const BEND = { x: 0.0016, yBase: -0.0006, yVar: 0.00025 };

export const CAMERA = { height: 4.4, distance: 8.6, lookAhead: -14, lookHeight: 1.3 };

// ---- Character -------------------------------------------------------------
export const CHARACTER_URL = '/character.glb';
export const CHARACTER_TARGET_HEIGHT = 2.07;
/** glTF models usually face +Z; the runner moves toward -Z so rotate by PI. Set to 0 if yours already faces -Z. */
export const CHARACTER_YAW = Math.PI;
export const RUN_ANIMATION_PATTERN = /run/i;
export const JUMP_ANIMATION_PATTERN = /jump/i;
export const FLIP_ANIMATION_PATTERN = /flip/i;
export const ROLL_ANIMATION_PATTERN = /roll|slide/i;
export const DIE_ANIMATION_PATTERN = /die/i;
export const FALL_ANIMATION_PATTERN = /fall/i;
export const FALL_STAY_DURATION = 3.0; // Seconds character stays down before showing gameover screen

// ---- Instanced chunk capacities -------------------------------------------
export const CHUNK_CAPACITY = { box: 460, cylinder: 300, cone: 40, sphere: 100, lamp: 80 } as const;

// ---- Banners & Hoardings ---------------------------------------------------
// Exact aspect ratios: image.png is 329x263, image copy.png is 800x199
export const BANNER_A_ASPECT = 329 / 263; // ~1.25095057
export const BANNER_B_ASPECT = 800 / 199; // ~4.02010050
export const BANNER_KINDS = ['bannerA', 'bannerB'] as const;
export const BANNER_CAPACITY = { bannerA: 64, bannerB: 64 } as const;
export const BANNER_TEXTURES = {
  bannerA: '/bannerimages/image.png',
  bannerB: '/bannerimages/image%20copy.png',
} as const;

// ---- Audio -----------------------------------------------------------------
export const BGM_URL = '/sounds/bgm.mp3';
export const BGM_DEFAULT_VOLUME = 0.5;
export const COIN_SOUND_URL = '/coin.mp3';
export const POWERUP_SOUND_URL = '/assets/power.mp3';
export const POWERUP_THEME_URL = '/assets/powerup.mp3';

// ---- Power-up / Turbo ------------------------------------------------------
export const POWERUP_URL = '/assets/powerup.glb';
export const TURBO_DURATION = 10.0;
export const TURBO_SPEED_MULTIPLIER = 8.0;
export const TURBO_DECEL_DURATION = 2.0;


