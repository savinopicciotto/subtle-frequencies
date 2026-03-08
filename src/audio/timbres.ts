/**
 * Instrument-inspired timbres using additive synthesis.
 * Each timbre defines harmonic amplitudes that shape the tone color
 * while keeping all partials locked to the harmonic grid.
 *
 * Uses PeriodicWave (Web Audio API) — every partial is an exact
 * integer multiple of the fundamental, so no unwanted frequencies.
 */

export type TimbreType =
  | 'sine'
  | 'cello'
  | 'singing-bowl'
  | 'crystal-bowl'
  | 'koshi-chime'
  | 'flute'
  | 'organ'
  | 'bell';

export interface TimbreDefinition {
  type: TimbreType;
  label: string;
  description: string;
  // Harmonic amplitudes: index 0 = DC (always 0), index 1 = fundamental,
  // index 2 = 2nd harmonic, etc. Values are relative (0-1).
  harmonics: number[];
}

export const TIMBRES: TimbreDefinition[] = [
  {
    type: 'sine',
    label: 'Pure Sine',
    description: 'Clean fundamental, no overtones',
    harmonics: [0, 1],
  },
  {
    type: 'cello',
    label: 'Cello',
    description: 'Rich, warm low-end with strong lower harmonics',
    // Cello has a rich harmonic series — strong 1st-3rd, gradual rolloff
    harmonics: [0, 1, 0.8, 0.55, 0.4, 0.3, 0.2, 0.15, 0.1, 0.07, 0.05, 0.03, 0.02],
  },
  {
    type: 'singing-bowl',
    label: 'Singing Bowl',
    description: 'Prominent odd harmonics with metallic shimmer',
    // Bowls emphasize odd harmonics (1, 3, 5) with weaker evens
    harmonics: [0, 1, 0.08, 0.45, 0.05, 0.3, 0.03, 0.18, 0.02, 0.1, 0.01, 0.06, 0.01, 0.03],
  },
  {
    type: 'crystal-bowl',
    label: 'Crystal Bowl',
    description: 'Ethereal, almost pure with gentle overtones',
    // Crystal bowls are very pure — mostly fundamental with faint 2nd and 3rd
    harmonics: [0, 1, 0.12, 0.06, 0.03, 0.015],
  },
  {
    type: 'koshi-chime',
    label: 'Koshi Chime',
    description: 'Bright, sparkling with strong upper harmonics',
    // Chimes have energy distributed across upper partials
    harmonics: [0, 0.6, 0.4, 0.5, 0.55, 0.65, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08, 0.06],
  },
  {
    type: 'flute',
    label: 'Flute',
    description: 'Soft, breathy with odd harmonics only',
    // Flutes are cylindrical closed pipes — odd harmonics dominate
    harmonics: [0, 1, 0, 0.28, 0, 0.12, 0, 0.05, 0, 0.02],
  },
  {
    type: 'organ',
    label: 'Organ',
    description: 'Full, sustained with balanced harmonic series',
    // Organ pipes have a full harmonic series, fairly even distribution
    harmonics: [0, 1, 0.7, 0.5, 0.35, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.025, 0.02],
  },
  {
    type: 'bell',
    label: 'Temple Bell',
    description: 'Deep resonance with inharmonic-flavored partials',
    // Bells have a unique pattern — strong 1st, prominent minor 3rd region (partial 6),
    // and strong upper partials. We approximate the "bell-like" quality
    // while keeping everything harmonic.
    harmonics: [0, 1, 0.15, 0.1, 0.4, 0.08, 0.5, 0.06, 0.3, 0.04, 0.2, 0.03, 0.15],
  },
];

/**
 * Create a PeriodicWave from a timbre definition.
 * Returns null for 'sine' (use native osc.type = 'sine' instead).
 */
export function createTimbreWave(
  context: BaseAudioContext,
  timbreType: TimbreType,
): PeriodicWave | null {
  if (timbreType === 'sine') return null;

  const timbre = TIMBRES.find((t) => t.type === timbreType);
  if (!timbre) return null;

  const real = new Float32Array(timbre.harmonics.length);
  const imag = new Float32Array(timbre.harmonics.length);

  // All energy in sine (imag) components — standard for musical tones
  for (let i = 0; i < timbre.harmonics.length; i++) {
    real[i] = 0;
    imag[i] = timbre.harmonics[i];
  }

  return context.createPeriodicWave(real, imag, { disableNormalization: false });
}

/**
 * Apply a timbre to an oscillator node.
 */
export function applyTimbre(
  osc: OscillatorNode,
  context: BaseAudioContext,
  timbreType: TimbreType,
): void {
  if (timbreType === 'sine') {
    osc.type = 'sine';
    return;
  }

  const wave = createTimbreWave(context, timbreType);
  if (wave) {
    osc.setPeriodicWave(wave);
  } else {
    osc.type = 'sine';
  }
}
