/**
 * Preset management utilities
 */

import type { TextureType } from '../audio/textureEngine';
import type { BrainwaveState } from '../audio/binauralEngine';

export interface Preset {
  name: string;
  frequency: number;
  binauralEnabled: boolean;
  binauralState: BrainwaveState;
  binauralBeatHz: number;
  texture: TextureType;
  frequencyVolume: number;
  binauralVolume: number;
  textureVolume: number;
  timerMinutes: number;
}

export const HEALING_FREQUENCIES = [
  { hz: 174, label: 'Pain Relief', color: '#8B4513' },
  { hz: 285, label: 'Tissue Healing', color: '#A0522D' },
  { hz: 396, label: 'Liberation from Fear', color: '#CD853F' },
  { hz: 417, label: 'Facilitating Change', color: '#DEB887' },
  { hz: 432, label: 'Natural Tuning', color: '#F4A460' },
  { hz: 528, label: 'DNA Repair / Love', color: '#FFD700' },
  { hz: 639, label: 'Connecting Relationships', color: '#FFA500' },
  { hz: 741, label: 'Awakening Intuition', color: '#FF8C00' },
  { hz: 852, label: 'Spiritual Order', color: '#FF7F50' },
  { hz: 963, label: 'Divine Consciousness', color: '#FF6347' },
];

export const DEFAULT_PRESETS: Preset[] = [
  {
    name: 'Deep Sleep',
    frequency: 174,
    binauralEnabled: true,
    binauralState: 'delta',
    binauralBeatHz: 2,
    texture: 'ocean',
    frequencyVolume: 0.4,
    binauralVolume: 0.3,
    textureVolume: 0.2,
    timerMinutes: 30,
  },
  {
    name: 'Focus Flow',
    frequency: 528,
    binauralEnabled: true,
    binauralState: 'alpha',
    binauralBeatHz: 10,
    texture: 'none',
    frequencyVolume: 0.5,
    binauralVolume: 0.3,
    textureVolume: 0,
    timerMinutes: 60,
  },
  {
    name: 'Morning Reset',
    frequency: 432,
    binauralEnabled: false,
    binauralState: 'alpha',
    binauralBeatHz: 10,
    texture: 'singing-bowl',
    frequencyVolume: 0.5,
    binauralVolume: 0,
    textureVolume: 0.25,
    timerMinutes: 15,
  },
];

const STORAGE_KEY = 'subtle-frequencies-presets';

export function savePreset(preset: Preset): void {
  const presets = loadCustomPresets();
  const existingIndex = presets.findIndex((p) => p.name === preset.name);

  if (existingIndex >= 0) {
    presets[existingIndex] = preset;
  } else {
    presets.push(preset);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function loadCustomPresets(): Preset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load presets:', error);
    return [];
  }
}

export function deletePreset(name: string): void {
  const presets = loadCustomPresets();
  const filtered = presets.filter((p) => p.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getAllPresets(): Preset[] {
  return [...DEFAULT_PRESETS, ...loadCustomPresets()];
}
