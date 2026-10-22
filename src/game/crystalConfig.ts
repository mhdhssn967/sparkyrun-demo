import { useSyncExternalStore } from 'react';

export interface CrystalConfig {
  scale: number;        // size multiplier (0.1 to 3.0)
  rotX: number;         // X rotation in degrees (-180 to 180)
  rotY: number;         // Y rotation in degrees (-180 to 180)
  rotZ: number;         // Z rotation in degrees (-180 to 180)
  heightOffset: number; // elevation offset in meters (-1.0 to 1.5)
  autoSpin: boolean;    // whether crystal rotates around Y while playing
}

export const DEFAULT_CRYSTAL_CONFIG: CrystalConfig = {
  scale: 1.0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  heightOffset: 0,
  autoSpin: true,
};

const STORAGE_KEY = 'sparky-goldcoin-config';

function loadStoredConfig(): CrystalConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CRYSTAL_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      scale: typeof parsed.scale === 'number' ? parsed.scale : DEFAULT_CRYSTAL_CONFIG.scale,
      rotX: typeof parsed.rotX === 'number' ? parsed.rotX : DEFAULT_CRYSTAL_CONFIG.rotX,
      rotY: typeof parsed.rotY === 'number' ? parsed.rotY : DEFAULT_CRYSTAL_CONFIG.rotY,
      rotZ: typeof parsed.rotZ === 'number' ? parsed.rotZ : DEFAULT_CRYSTAL_CONFIG.rotZ,
      heightOffset: typeof parsed.heightOffset === 'number' ? parsed.heightOffset : DEFAULT_CRYSTAL_CONFIG.heightOffset,
      autoSpin: typeof parsed.autoSpin === 'boolean' ? parsed.autoSpin : DEFAULT_CRYSTAL_CONFIG.autoSpin,
    };
  } catch {
    return { ...DEFAULT_CRYSTAL_CONFIG };
  }
}

let currentConfig: CrystalConfig = loadStoredConfig();
const listeners = new Set<() => void>();

export function getCrystalConfig(): CrystalConfig {
  return currentConfig;
}

export function setCrystalConfig(patch: Partial<CrystalConfig>) {
  currentConfig = { ...currentConfig, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
  } catch {
    /* ignore storage quota */
  }
  listeners.forEach((l) => l());
}

export function resetCrystalConfig() {
  setCrystalConfig({ ...DEFAULT_CRYSTAL_CONFIG });
}

export function subscribeCrystalConfig(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCrystalConfig(): CrystalConfig {
  return useSyncExternalStore(subscribeCrystalConfig, getCrystalConfig, () => DEFAULT_CRYSTAL_CONFIG);
}
