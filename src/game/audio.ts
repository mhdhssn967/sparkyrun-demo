import { useSyncExternalStore } from 'react';
import {
  BGM_DEFAULT_VOLUME,
  BGM_URL,
  COIN_SOUND_URL,
  POWERUP_SOUND_URL,
  POWERUP_THEME_URL,
} from './constants';

const MUTE_KEY = 'sparky-run-muted';

function getStoredMute(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveStoredMute(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    /* ignore storage errors */
  }
}

let bgmAudio: HTMLAudioElement | null = null;
let isMutedState = getStoredMute();
let isPlayingState = false;
const listeners = new Set<(muted: boolean) => void>();

function notify() {
  listeners.forEach((fn) => fn(isMutedState));
}

function getAudio(): HTMLAudioElement {
  if (!bgmAudio) {
    bgmAudio = new Audio(BGM_URL);
    bgmAudio.loop = true;
    bgmAudio.preload = 'auto';
    bgmAudio.volume = isMutedState ? 0 : BGM_DEFAULT_VOLUME;
    bgmAudio.muted = isMutedState;

    // Handle tab visibility changes cleanly
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!bgmAudio) return;
        if (document.hidden) {
          if (!bgmAudio.paused) {
            bgmAudio.pause();
            isPlayingState = true;
          }
        } else if (isPlayingState && !isMutedState) {
          bgmAudio.play().catch(() => {});
        }
      });
    }
  }
  return bgmAudio;
}

export function playBGM(restart = false) {
  loadCoinSoundBuffer();
  loadPowerupSoundBuffer();
  loadTurboThemeBuffer();
  const audio = getAudio();
  if (restart) {
    try {
      audio.currentTime = 0;
    } catch {
      /* ignore seek error */
    }
  }
  audio.muted = isMutedState;
  audio.volume = isMutedState ? 0 : BGM_DEFAULT_VOLUME;
  isPlayingState = true;
  audio.play().catch(() => {
    // Autoplay blocked by browser policy; will start on user interaction
  });
}

export function restartBGM() {
  playBGM(true);
}

export function stopBGM() {
  if (bgmAudio) {
    bgmAudio.pause();
    try {
      bgmAudio.currentTime = 0;
    } catch {
      /* ignore seek error */
    }
  }
  isPlayingState = false;
}

export function pauseBGM() {
  if (bgmAudio) {
    bgmAudio.pause();
  }
  isPlayingState = false;
}

export function duckBGM(duckFactor = 0.5) {
  if (bgmAudio && !isMutedState) {
    bgmAudio.volume = BGM_DEFAULT_VOLUME * duckFactor;
  }
}

export function restoreBGMVolume() {
  if (bgmAudio && !isMutedState) {
    bgmAudio.volume = BGM_DEFAULT_VOLUME;
  }
}

export function isBgmPlaying(): boolean {
  return bgmAudio ? !bgmAudio.paused : false;
}

export function isMuted(): boolean {
  return isMutedState;
}

export function setMuted(muted: boolean) {
  isMutedState = muted;
  saveStoredMute(muted);
  if (muted) {
    stopTurboMusic(0.1);
  }
  if (bgmAudio) {
    bgmAudio.muted = muted;
    bgmAudio.volume = muted ? 0 : BGM_DEFAULT_VOLUME;
    if (!muted && isPlayingState && bgmAudio.paused) {
      bgmAudio.play().catch(() => {});
    }
  }
  notify();
}

export function toggleMute(): boolean {
  setMuted(!isMutedState);
  return isMutedState;
}

export function subscribeMute(callback: (muted: boolean) => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useIsMuted(): boolean {
  return useSyncExternalStore(
    subscribeMute,
    () => isMutedState,
    () => false,
  );
}

let audioCtx: AudioContext | null = null;
let coinAudioBuffer: AudioBuffer | null = null;
let isCoinLoading = false;
let powerupAudioBuffer: AudioBuffer | null = null;
let isPowerupLoading = false;
let powerupFallbackAudio: HTMLAudioElement | null = null;
let turboThemeBuffer: AudioBuffer | null = null;
let isTurboThemeLoading = false;
let currentTurboSource: AudioBufferSourceNode | null = null;
let currentTurboGain: GainNode | null = null;
let turboThemeAudio: HTMLAudioElement | null = null;
let turboFadeInterval: number | null = null;
const coinFallbackPool: HTMLAudioElement[] = [];
const POOL_SIZE = 8;
let poolIndex = 0;

function getAudioContext(): AudioContext | null {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  return audioCtx;
}

function initCoinFallbackPool() {
  if (typeof Audio === 'undefined' || coinFallbackPool.length > 0) return;
  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = new Audio(COIN_SOUND_URL);
    audio.preload = 'auto';
    coinFallbackPool.push(audio);
  }
}

export async function loadCoinSoundBuffer() {
  if (coinAudioBuffer || isCoinLoading) return;
  isCoinLoading = true;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const response = await fetch(COIN_SOUND_URL);
    const arrayBuffer = await response.arrayBuffer();
    coinAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch {
    /* Fallback audio pool handles playback if decoding fails */
  } finally {
    isCoinLoading = false;
  }
}

export async function loadPowerupSoundBuffer() {
  if (powerupAudioBuffer || isPowerupLoading) return;
  isPowerupLoading = true;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const response = await fetch(POWERUP_SOUND_URL);
    const arrayBuffer = await response.arrayBuffer();
    powerupAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch {
    /* Fallback HTMLAudioElement handles playback if decoding fails */
  } finally {
    isPowerupLoading = false;
  }
}

export async function loadTurboThemeBuffer() {
  if (turboThemeBuffer || isTurboThemeLoading) return;
  isTurboThemeLoading = true;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const response = await fetch(POWERUP_THEME_URL);
    const arrayBuffer = await response.arrayBuffer();
    turboThemeBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch {
    /* Fallback HTMLAudioElement handles playback */
  } finally {
    isTurboThemeLoading = false;
  }
}

// Preload audio and warm up AudioContext on first user interaction
if (typeof window !== 'undefined') {
  initCoinFallbackPool();
  const warmup = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    loadCoinSoundBuffer();
    loadPowerupSoundBuffer();
    loadTurboThemeBuffer();
  };
  window.addEventListener('pointerdown', warmup, { once: true });
  window.addEventListener('keydown', warmup, { once: true });
}

/** Plays the official coin collection sound (/coin.mp3). */
export function playCrystalPickupSound() {
  if (isMuted()) return;

  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (coinAudioBuffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = coinAudioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.75; // crisp, punchy audio balance against BGM

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        return;
      } catch {
        /* Fall back to HTMLAudioElement below */
      }
    } else {
      loadCoinSoundBuffer();
    }
  }

  // Fallback: rotating HTMLAudioElement pool for instant low-latency playback
  if (coinFallbackPool.length > 0) {
    const audio = coinFallbackPool[poolIndex % coinFallbackPool.length];
    poolIndex++;
    try {
      audio.currentTime = 0;
      audio.volume = 0.75;
      audio.play().catch(() => {});
    } catch {
      /* ignore playback errors */
    }
  }
}

/** Plays an energetic, resonant magnetic power-up surge sound. */
export function playMagnetPickupSound() {
  if (isMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Dual rising sweep for a sci-fi magnetic warp effect
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.28);

    osc2.frequency.setValueAtTime(480, now);
    osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.28);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.33);
    osc2.stop(now + 0.33);
  } catch {
    /* AudioContext not allowed */
  }
}

/** Plays the official power-up pickup sound (/assets/power.mp3). */
export function playTurboPickupSound() {
  if (isMuted()) return;

  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (powerupAudioBuffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = powerupAudioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.95; // Clear, punchy volume

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        return;
      } catch {
        /* Fall back to HTMLAudioElement below */
      }
    }
  }

  // Fallback: HTMLAudioElement
  try {
    if (!powerupFallbackAudio && typeof Audio !== 'undefined') {
      powerupFallbackAudio = new Audio(POWERUP_SOUND_URL);
      powerupFallbackAudio.preload = 'auto';
    }
    if (powerupFallbackAudio) {
      powerupFallbackAudio.currentTime = 0;
      powerupFallbackAudio.volume = 0.95;
      powerupFallbackAudio.play().catch(() => {});
    }
  } catch {
    /* AudioContext not allowed / autoplay blocked */
  }
}

/**
 * Starts the powerup theme sound (/assets/powerup.mp3) with a 0.6s smooth fade in.
 * Ducks the background music so the powerup theme stands out.
 */
export function startTurboMusic() {
  if (isMuted()) return;

  // Clean up any existing turbo music instance
  stopTurboMusic(0.05);
  duckBGM(0.18);

  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (turboThemeBuffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = turboThemeBuffer;
        source.loop = true;

        const gainNode = ctx.createGain();
        const now = ctx.currentTime;
        // Fade in 0.6 seconds
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.92, now + 0.6);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(now);

        currentTurboSource = source;
        currentTurboGain = gainNode;
        return;
      } catch {
        /* Fall back to HTMLAudioElement */
      }
    }
  }

  // Fallback: HTMLAudioElement with scripted 0.6s fade-in
  try {
    if (!turboThemeAudio && typeof Audio !== 'undefined') {
      turboThemeAudio = new Audio(POWERUP_THEME_URL);
      turboThemeAudio.loop = true;
      turboThemeAudio.preload = 'auto';
    }
    if (turboThemeAudio) {
      if (turboFadeInterval) clearInterval(turboFadeInterval);
      turboThemeAudio.currentTime = 0;
      turboThemeAudio.volume = 0;
      turboThemeAudio.play().catch(() => {});

      const start = performance.now();
      const targetVol = 0.92;
      turboFadeInterval = window.setInterval(() => {
        if (!turboThemeAudio) return;
        const elapsed = (performance.now() - start) / 1000;
        const progress = Math.min(1, elapsed / 0.6);
        turboThemeAudio.volume = progress * targetVol;
        if (progress >= 1) {
          if (turboFadeInterval) clearInterval(turboFadeInterval);
          turboFadeInterval = null;
        }
      }, 25);
    }
  } catch {
    /* Autoplay prevented */
  }
}

/**
 * Fades out the powerup theme sound over the specified duration (defaults to 1.0s)
 * and restores background music volume.
 */
export function stopTurboMusic(fadeDuration = 1.0) {
  restoreBGMVolume();

  const ctx = getAudioContext();
  if (ctx && currentTurboGain && currentTurboSource) {
    try {
      const now = ctx.currentTime;
      const currentGain = currentTurboGain.gain.value;
      currentTurboGain.gain.cancelScheduledValues(now);
      currentTurboGain.gain.setValueAtTime(Math.max(0.0001, currentGain), now);
      currentTurboGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);

      const src = currentTurboSource;
      setTimeout(() => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          /* already stopped */
        }
      }, fadeDuration * 1000 + 60);

      currentTurboSource = null;
      currentTurboGain = null;
    } catch {
      /* ignore audio context errors */
    }
  }

  // Fallback HTMLAudioElement fade-out
  if (turboThemeAudio && !turboThemeAudio.paused) {
    if (turboFadeInterval) clearInterval(turboFadeInterval);
    const start = performance.now();
    const startVol = turboThemeAudio.volume;
    turboFadeInterval = window.setInterval(() => {
      if (!turboThemeAudio) return;
      const elapsed = (performance.now() - start) / 1000;
      const progress = Math.min(1, elapsed / fadeDuration);
      turboThemeAudio.volume = Math.max(0, startVol * (1 - progress));
      if (progress >= 1) {
        if (turboFadeInterval) clearInterval(turboFadeInterval);
        turboFadeInterval = null;
        turboThemeAudio.pause();
        turboThemeAudio.currentTime = 0;
      }
    }, 25);
  }
}



