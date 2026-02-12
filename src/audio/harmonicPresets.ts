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

  // === SACRED GEOMETRY PRESETS ===

  {
    name: 'Golden Spiral',
    description: 'Pure golden ratio (φ) harmonics - nature\'s perfect proportion',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'none' }, // Fundamental
      { ratio: 1.618, beatFrequency: 0.618, volume: 0.35, effect: 'none' }, // φ
      { ratio: 2.618, beatFrequency: 0, volume: 0.25, effect: 'none' }, // φ²
      { ratio: 4.236, beatFrequency: 1.618, volume: 0.2, effect: 'none' }, // φ³
    ],
  },

  {
    name: 'Fibonacci Sequence',
    description: 'Natural growth pattern - spirals of galaxies and seashells',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'none' }, // 1
      { ratio: 2, beatFrequency: 1, volume: 0.35, effect: 'none' }, // 2
      { ratio: 3, beatFrequency: 0, volume: 0.3, effect: 'none' }, // 3
      { ratio: 5, beatFrequency: 1.618, volume: 0.25, effect: 'none' }, // 5
      { ratio: 8, beatFrequency: 0, volume: 0.2, effect: 'none' }, // 8
    ],
  },

  {
    name: 'Flower of Life',
    description: 'Ancient sacred geometry - circles in perfect harmony',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'none' }, // Center
      { ratio: 1.732, beatFrequency: 1, volume: 0.3, effect: 'none' }, // √3 (hexagon)
      { ratio: 2, beatFrequency: 0, volume: 0.3, effect: 'none' }, // First ring
      { ratio: 3, beatFrequency: 1.732, volume: 0.25, effect: 'none' }, // Second ring
      { ratio: 3.464, beatFrequency: 0, volume: 0.2, effect: 'none' }, // 2√3
    ],
  },

  {
    name: 'Platonic Resonance',
    description: 'Five perfect 3D forms - building blocks of reality',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.35, effect: 'none' }, // Tetrahedron (4)
      { ratio: 1.333, beatFrequency: 0, volume: 0.3, effect: 'none' }, // Cube (6/4.5)
      { ratio: 1.667, beatFrequency: 1, volume: 0.3, effect: 'none' }, // Octahedron (6/3.6)
      { ratio: 2.236, beatFrequency: 0, volume: 0.25, effect: 'none' }, // Dodecahedron (√5)
      { ratio: 2.618, beatFrequency: 1.618, volume: 0.2, effect: 'none' }, // Icosahedron (φ²)
    ],
  },

  {
    name: 'Metatron\'s Cube',
    description: 'All platonic solids unified - the blueprint of creation',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.35, effect: 'none' }, // Center point
      { ratio: 1.414, beatFrequency: 0.707, volume: 0.3, effect: 'trickle' }, // √2 (octahedron)
      { ratio: 1.732, beatFrequency: 0, volume: 0.28, effect: 'none' }, // √3 (tetrahedron)
      { ratio: 2, beatFrequency: 1, volume: 0.25, effect: 'shake' }, // Cube
      { ratio: 2.236, beatFrequency: 0, volume: 0.22, effect: 'none' }, // √5 (dodecahedron)
      { ratio: 2.618, beatFrequency: 1.618, volume: 0.2, effect: 'trickle' }, // φ² (icosahedron)
    ],
  },

  {
    name: 'Sri Yantra Mandala',
    description: 'Nine interlocking triangles - cosmic union',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'none' }, // Bindu (center point)
      { ratio: 1.5, beatFrequency: 0, volume: 0.35, effect: 'bend-up' }, // 3/2 - Shiva (upward)
      { ratio: 1.333, beatFrequency: 0, volume: 0.35, effect: 'bend-down' }, // 4/3 - Shakti (downward)
      { ratio: 1.732, beatFrequency: 1, volume: 0.3, effect: 'none' }, // √3 - triangle geometry
      { ratio: 2, beatFrequency: 0, volume: 0.25, effect: 'shake' }, // Outer square
      { ratio: 3, beatFrequency: 1.732, volume: 0.2, effect: 'trickle' }, // Lotus petals
    ],
  },

  {
    name: 'Vesica Piscis',
    description: 'Sacred intersection - birth of form from void',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'none' }, // First circle
      { ratio: 1.732, beatFrequency: 0.866, volume: 0.35, effect: 'none' }, // √3 - vesica width
      { ratio: 2, beatFrequency: 0, volume: 0.3, effect: 'buzz' }, // Second circle
      { ratio: 3.464, beatFrequency: 1.732, volume: 0.25, effect: 'none' }, // 2√3 - combined field
    ],
  },

  {
    name: 'Merkaba Spin',
    description: 'Two tetrahedrons - star tetrahedron light body',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.35, effect: 'none' }, // Center
      { ratio: 1.414, beatFrequency: 3, volume: 0.3, effect: 'shake' }, // √2 - spinning
      { ratio: 1.732, beatFrequency: 0, volume: 0.3, effect: 'none' }, // √3 - tetrahedron
      { ratio: 2, beatFrequency: 2, volume: 0.25, effect: 'shake' }, // Counter-spin
      { ratio: 2.828, beatFrequency: 0, volume: 0.2, effect: 'buzz' }, // 2√2 - outer field
    ],
  },

  {
    name: 'Phi Cascade',
    description: 'Golden ratio waterfall - divine proportion flows',
    layers: [
      { ratio: 1, beatFrequency: 0, volume: 0.4, effect: 'trickle' }, // 1
      { ratio: 1.618, beatFrequency: 1, volume: 0.35, effect: 'trickle' }, // φ
      { ratio: 2.618, beatFrequency: 1.5, volume: 0.3, effect: 'trickle' }, // φ²
      { ratio: 4.236, beatFrequency: 2, volume: 0.25, effect: 'trickle' }, // φ³
      { ratio: 6.854, beatFrequency: 2.5, volume: 0.2, effect: 'trickle' }, // φ⁴
    ],
  },
];
