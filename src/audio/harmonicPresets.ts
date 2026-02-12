/**
 * Harmonic layer presets showcasing effects and multi-layer compositions
 */

import type { HarmonicEffect } from './harmonicEngine';

export interface HarmonicPreset {
  name: string;
  description: string;
  layers: Array<{
    ratio: number;
    beatFrequency: number;
    volume: number;
    effect: HarmonicEffect;
  }>;
}

export const HARMONIC_PRESETS: HarmonicPreset[] = [
  {
    name: 'Tibetan Temple',
    description: 'Deep, breathing tones with gentle pitch bends',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'none' },
      { ratio: 2, beatFrequency: 0.5, volume: 0.3, effect: 'bend-up' },
      { ratio: 3, beatFrequency: 0, volume: 0.25, effect: 'bend-down' },
    ],
  },
  {
    name: 'Crystal Cascade',
    description: 'Shimmering harmonics with trickling pitch shifts',
    layers: [
      { ratio: 2, beatFrequency: 1, volume: 0.3, effect: 'trickle' },
      { ratio: 3, beatFrequency: 0, volume: 0.25, effect: 'trickle' },
      { ratio: 5, beatFrequency: 1.5, volume: 0.2, effect: 'trickle' },
      { ratio: 7, beatFrequency: 0, volume: 0.15, effect: 'none' },
    ],
  },
  {
    name: 'Deep Meditation',
    description: 'Low, buzzing drones for grounding',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.45, effect: 'buzz' },
      { ratio: 1.5, beatFrequency: 0, volume: 0.3, effect: 'buzz' },
      { ratio: 2, beatFrequency: 2, volume: 0.25, effect: 'none' },
    ],
  },
  {
    name: 'Celestial Shimmer',
    description: 'High harmonics with rapid shimmering',
    layers: [
      { ratio: 3, beatFrequency: 0, volume: 0.3, effect: 'shake' },
      { ratio: 5, beatFrequency: 1, volume: 0.25, effect: 'shake' },
      { ratio: 7, beatFrequency: 0, volume: 0.2, effect: 'none' },
      { ratio: 8, beatFrequency: 2, volume: 0.15, effect: 'trickle' },
    ],
  },
  {
    name: 'Ocean Waves',
    description: 'Flowing, undulating tones',
    layers: [
      { ratio: 1, beatFrequency: 0.3, volume: 0.35, effect: 'bend-up' },
      { ratio: 2, beatFrequency: 0.5, volume: 0.3, effect: 'bend-down' },
      { ratio: 3, beatFrequency: 0, volume: 0.25, effect: 'bend-up' },
      { ratio: 4, beatFrequency: 0.8, volume: 0.2, effect: 'none' },
    ],
  },
  {
    name: 'Sacred Chant',
    description: 'Vocal-like harmonics with organic movement',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'none' },
      { ratio: 2, beatFrequency: 1.2, volume: 0.3, effect: 'none' },
      { ratio: 3, beatFrequency: 0, volume: 0.25, effect: 'buzz' },
      { ratio: 5, beatFrequency: 0, volume: 0.2, effect: 'shake' },
      { ratio: 6, beatFrequency: 2, volume: 0.15, effect: 'none' },
    ],
  },
  {
    name: 'Cosmic Tremor',
    description: 'Intense shaking and buzzing energy',
    layers: [
      { ratio: 2, beatFrequency: 3, volume: 0.35, effect: 'shake' },
      { ratio: 4, beatFrequency: 0, volume: 0.3, effect: 'buzz' },
      { ratio: 6, beatFrequency: 2.5, volume: 0.25, effect: 'shake' },
      { ratio: 8, beatFrequency: 0, volume: 0.2, effect: 'buzz' },
    ],
  },
  {
    name: 'Sunrise Ascension',
    description: 'Rising harmonics with cascading effects',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'bend-up' },
      { ratio: 2, beatFrequency: 0, volume: 0.3, effect: 'bend-up' },
      { ratio: 3, beatFrequency: 1, volume: 0.25, effect: 'trickle' },
      { ratio: 5, beatFrequency: 0, volume: 0.2, effect: 'shake' },
    ],
  },
];
