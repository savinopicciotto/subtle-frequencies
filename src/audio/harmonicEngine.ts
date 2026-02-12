/**
 * Harmonic series engine for pure-ratio (just intonation) harmonics
 * Enhanced with organic modulation for Tibetan singing bowl-like breathing
 */

import { audioEngine } from './AudioEngine';

export type HarmonicEffect = 'none' | 'bend-up' | 'bend-down' | 'trickle' | 'shake' | 'buzz';

interface HarmonicLayer {
  ratio: number; // Harmonic ratio (e.g., 2/1, 3/2, 5/4)
  beatFrequency: number; // Independent pulse/beat frequency in Hz
  volume: number;
  effect: HarmonicEffect; // Special effect type
  oscillator: OscillatorNode | null;

  // Amplitude modulation (tremolo/breathing)
  lfoOscillator: OscillatorNode | null;
  lfoGain: GainNode | null;

  // Pitch modulation (vibrato/shimmer)
  vibratoOscillator: OscillatorNode | null;
  vibratoGain: GainNode | null;

  // Slow breathing modulation
  breathingOscillator: OscillatorNode | null;
  breathingGain: GainNode | null;

  // Special effect modulation
  effectOscillator: OscillatorNode | null;
  effectGain: GainNode | null;

  gainNode: GainNode | null;

  // Organic characteristics
  phaseOffset: number; // Unique phase for each layer's modulation
  detuneAmount: number; // Slight frequency offset for chorus effect
}

// Pure interval ratios (just intonation)
export const PURE_RATIOS = {
  unison: 1 / 1,
  octave: 2 / 1,
  perfectFifth: 3 / 2,
  perfectFourth: 4 / 3,
  majorThird: 5 / 4,
  minorThird: 6 / 5,
  majorSixth: 5 / 3,
  minorSixth: 8 / 5,
  majorSecond: 9 / 8,
  minorSeventh: 16 / 9,
  majorSeventh: 15 / 8,
};

export const HARMONIC_SERIES = [
  // Subharmonics (below fundamental)
  { ratio: 0.25, label: 'Subharmonic 1/4 (2 Octaves Down)' },
  { ratio: 0.5, label: 'Subharmonic 1/2 (Octave Down)' },
  { ratio: 0.75, label: 'Subharmonic 3/4 (Perfect 4th Down)' },

  // Fundamental and harmonics
  { ratio: 1, label: 'Fundamental' },
  { ratio: 1.5, label: '3/2 (Perfect 5th)' },
  { ratio: 2, label: '2nd Harmonic (Octave)' },
  { ratio: 3, label: '3rd Harmonic (Perfect 5th + Octave)' },
  { ratio: 4, label: '4th Harmonic (2 Octaves)' },
  { ratio: 5, label: '5th Harmonic (Major 3rd + 2 Octaves)' },
  { ratio: 6, label: '6th Harmonic' },
  { ratio: 7, label: '7th Harmonic (Natural 7th)' },
  { ratio: 8, label: '8th Harmonic (3 Octaves)' },
  { ratio: 9, label: '9th Harmonic' },
  { ratio: 12, label: '12th Harmonic' },
  { ratio: 16, label: '16th Harmonic (4 Octaves)' },
];

export class HarmonicEngine {
  private baseFrequency = 432; // Fundamental frequency
  private layers: HarmonicLayer[] = [];
  private isPlaying = false;

  /**
   * Add a harmonic layer with organic characteristics and effects
   */
  addLayer(
    ratio: number,
    beatFrequency: number = 0,
    volume: number = 0.3,
    effect: HarmonicEffect = 'none'
  ): void {
    const layer: HarmonicLayer = {
      ratio,
      beatFrequency,
      volume,
      effect,
      oscillator: null,
      lfoOscillator: null,
      lfoGain: null,
      vibratoOscillator: null,
      vibratoGain: null,
      breathingOscillator: null,
      breathingGain: null,
      effectOscillator: null,
      effectGain: null,
      gainNode: null,

      // Organic characteristics - each layer gets unique values
      phaseOffset: Math.random() * Math.PI * 2,
      detuneAmount: (Math.random() - 0.5) * 2, // ±1 cent for subtle chorus
    };

    this.layers.push(layer);
  }

  /**
   * Remove a harmonic layer by index
   */
  removeLayer(index: number): void {
    if (index >= 0 && index < this.layers.length) {
      this.stopLayer(this.layers[index]);
      this.layers.splice(index, 1);
    }
  }

  /**
   * Clear all layers
   */
  clearLayers(): void {
    this.layers.forEach((layer) => this.stopLayer(layer));
    this.layers = [];
  }

  /**
   * Update base frequency (all harmonics recalculate)
   */
  updateBaseFrequency(frequency: number): void {
    this.baseFrequency = frequency;

    if (this.isPlaying) {
      this.layers.forEach((layer) => {
        if (layer.oscillator) {
          const harmonicFreq = this.baseFrequency * layer.ratio;
          const context = audioEngine.getContext();
          const now = context.currentTime;

          layer.oscillator.frequency.cancelScheduledValues(now);
          layer.oscillator.frequency.setValueAtTime(layer.oscillator.frequency.value, now);
          layer.oscillator.frequency.linearRampToValueAtTime(harmonicFreq, now + 0.1);
        }
      });
    }
  }

  /**
   * Update beat frequency for a specific layer
   */
  updateLayerBeat(index: number, beatFrequency: number): void {
    if (index >= 0 && index < this.layers.length) {
      const layer = this.layers[index];
      layer.beatFrequency = beatFrequency;

      if (this.isPlaying && layer.lfoOscillator) {
        const context = audioEngine.getContext();
        const now = context.currentTime;

        layer.lfoOscillator.frequency.cancelScheduledValues(now);
        layer.lfoOscillator.frequency.setValueAtTime(layer.lfoOscillator.frequency.value, now);
        layer.lfoOscillator.frequency.linearRampToValueAtTime(beatFrequency, now + 0.1);
      }
    }
  }

  /**
   * Update volume for a specific layer
   */
  updateLayerVolume(index: number, volume: number): void {
    if (index >= 0 && index < this.layers.length) {
      const layer = this.layers[index];
      layer.volume = volume;

      if (this.isPlaying && layer.gainNode) {
        const context = audioEngine.getContext();
        const now = context.currentTime;

        layer.gainNode.gain.cancelScheduledValues(now);
        layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
        layer.gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
      }
    }
  }

  /**
   * Start playing all layers
   */
  start(): void {
    if (this.isPlaying) return;

    this.layers.forEach((layer) => this.startLayer(layer));
    this.isPlaying = true;
  }

  /**
   * Start a single layer with organic modulation (Tibetan singing bowl character)
   */
  private startLayer(layer: HarmonicLayer): void {
    const context = audioEngine.getContext();
    const masterGain = audioEngine.getMasterGain();
    const now = context.currentTime;

    // Calculate harmonic frequency with subtle detuning
    const baseHarmonicFreq = this.baseFrequency * layer.ratio;

    // Create main oscillator
    layer.oscillator = context.createOscillator();
    layer.oscillator.type = 'sine'; // Pure sine for harmonics
    layer.oscillator.frequency.value = baseHarmonicFreq;
    layer.oscillator.detune.value = layer.detuneAmount; // Subtle detuning

    // Create gain node
    layer.gainNode = context.createGain();
    layer.gainNode.gain.setValueAtTime(0, now);
    layer.gainNode.gain.linearRampToValueAtTime(layer.volume, now + 0.5);

    // === ORGANIC MODULATION 1: Slow Breathing (0.05-0.2 Hz) ===
    // This creates the "alive" quality - very slow amplitude swell
    layer.breathingOscillator = context.createOscillator();
    layer.breathingGain = context.createGain();

    const breathingRate = 0.08 + (Math.random() * 0.1); // 0.08-0.18 Hz (6-11 second cycles)
    layer.breathingOscillator.type = 'sine';
    layer.breathingOscillator.frequency.value = breathingRate;

    // Breathing modulation depth - subtle but noticeable
    layer.breathingGain.gain.value = layer.volume * 0.2;

    layer.breathingOscillator.connect(layer.breathingGain);
    layer.breathingGain.connect(layer.gainNode.gain);
    layer.breathingOscillator.start();

    // === ORGANIC MODULATION 2: Pitch Vibrato (2-4 Hz) ===
    // Subtle frequency wobble for shimmer
    layer.vibratoOscillator = context.createOscillator();
    layer.vibratoGain = context.createGain();

    const vibratoRate = 2.5 + (Math.random() * 1.5); // 2.5-4 Hz
    layer.vibratoOscillator.type = 'triangle'; // Triangle for smoother vibrato
    layer.vibratoOscillator.frequency.value = vibratoRate;

    // Vibrato depth in cents (very subtle)
    layer.vibratoGain.gain.value = 3 + Math.random() * 2; // ±3-5 cents

    layer.vibratoOscillator.connect(layer.vibratoGain);
    layer.vibratoGain.connect(layer.oscillator.detune);
    layer.vibratoOscillator.start();

    // === ORGANIC MODULATION 3: User-controlled beat/tremolo ===
    // If beat frequency is set, add faster tremolo
    if (layer.beatFrequency > 0) {
      layer.lfoOscillator = context.createOscillator();
      layer.lfoGain = context.createGain();

      layer.lfoOscillator.type = 'sine';
      layer.lfoOscillator.frequency.value = layer.beatFrequency;

      // LFO depth (how much the volume oscillates)
      layer.lfoGain.gain.value = layer.volume * 0.4;

      // Connect LFO: lfoOscillator -> lfoGain -> gainNode.gain
      layer.lfoOscillator.connect(layer.lfoGain);
      layer.lfoGain.connect(layer.gainNode.gain);

      layer.lfoOscillator.start();
    }

    // === SPECIAL EFFECTS ===
    this.applyEffect(layer, context);

    // Connect oscillator through gain to master
    layer.oscillator.connect(layer.gainNode);
    layer.gainNode.connect(masterGain);

    // Start oscillator
    layer.oscillator.start();
  }

  /**
   * Apply special effect to a layer
   */
  private applyEffect(layer: HarmonicLayer, context: AudioContext): void {
    if (layer.effect === 'none' || !layer.oscillator) return;

    layer.effectOscillator = context.createOscillator();
    layer.effectGain = context.createGain();

    switch (layer.effect) {
      case 'bend-up': {
        // Slow pitch rise over 10-20 seconds
        layer.effectOscillator.type = 'sawtooth';
        layer.effectOscillator.frequency.value = 0.05 + Math.random() * 0.05; // 0.05-0.1 Hz
        layer.effectGain.gain.value = 30 + Math.random() * 20; // ±30-50 cents rise
        layer.effectOscillator.connect(layer.effectGain);
        layer.effectGain.connect(layer.oscillator.detune);
        layer.effectOscillator.start();
        break;
      }

      case 'bend-down': {
        // Slow pitch fall
        layer.effectOscillator.type = 'sawtooth';
        layer.effectOscillator.frequency.value = 0.05 + Math.random() * 0.05;
        layer.effectGain.gain.value = -(30 + Math.random() * 20); // ±30-50 cents fall
        layer.effectOscillator.connect(layer.effectGain);
        layer.effectGain.connect(layer.oscillator.detune);
        layer.effectOscillator.start();
        break;
      }

      case 'trickle': {
        // Cascading stepped pitch changes - square wave for discrete steps
        layer.effectOscillator.type = 'square';
        layer.effectOscillator.frequency.value = 0.2 + Math.random() * 0.3; // 0.2-0.5 Hz
        layer.effectGain.gain.value = 15 + Math.random() * 10; // ±15-25 cents steps
        layer.effectOscillator.connect(layer.effectGain);
        layer.effectGain.connect(layer.oscillator.detune);
        layer.effectOscillator.start();
        break;
      }

      case 'shake': {
        // Fast pitch vibrato - intense shimmer
        layer.effectOscillator.type = 'triangle';
        layer.effectOscillator.frequency.value = 10 + Math.random() * 10; // 10-20 Hz
        layer.effectGain.gain.value = 8 + Math.random() * 7; // ±8-15 cents
        layer.effectOscillator.connect(layer.effectGain);
        layer.effectGain.connect(layer.oscillator.detune);
        layer.effectOscillator.start();
        break;
      }

      case 'buzz': {
        // Very fast amplitude modulation - creates buzzing harmonics
        layer.effectOscillator.type = 'sine';
        layer.effectOscillator.frequency.value = 40 + Math.random() * 40; // 40-80 Hz
        layer.effectGain.gain.value = layer.volume * 0.3; // 30% amplitude buzz
        layer.effectOscillator.connect(layer.effectGain);
        if (layer.gainNode) {
          layer.effectGain.connect(layer.gainNode.gain);
        }
        layer.effectOscillator.start();
        break;
      }
    }
  }

  /**
   * Stop playing all layers
   */
  stop(): void {
    if (!this.isPlaying) return;

    const context = audioEngine.getContext();
    const now = context.currentTime;

    this.layers.forEach((layer) => {
      if (layer.gainNode) {
        // Fade out
        layer.gainNode.gain.cancelScheduledValues(now);
        layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
        layer.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
      }

      if (layer.oscillator) {
        layer.oscillator.stop(now + 0.5);
      }

      if (layer.lfoOscillator) {
        layer.lfoOscillator.stop(now + 0.5);
      }

      if (layer.vibratoOscillator) {
        layer.vibratoOscillator.stop(now + 0.5);
      }

      if (layer.breathingOscillator) {
        layer.breathingOscillator.stop(now + 0.5);
      }

      if (layer.effectOscillator) {
        layer.effectOscillator.stop(now + 0.5);
      }
    });

    // Cleanup after fade
    setTimeout(() => {
      this.layers.forEach((layer) => this.stopLayer(layer));
    }, 600);

    this.isPlaying = false;
  }

  /**
   * Stop and cleanup a single layer
   */
  private stopLayer(layer: HarmonicLayer): void {
    const nodes = [
      layer.oscillator,
      layer.lfoOscillator,
      layer.vibratoOscillator,
      layer.breathingOscillator,
      layer.effectOscillator,
      layer.gainNode,
      layer.lfoGain,
      layer.vibratoGain,
      layer.breathingGain,
      layer.effectGain,
    ];

    nodes.forEach((node) => {
      if (node) {
        try {
          node.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }
    });

    layer.oscillator = null;
    layer.lfoOscillator = null;
    layer.vibratoOscillator = null;
    layer.breathingOscillator = null;
    layer.effectOscillator = null;
    layer.gainNode = null;
    layer.lfoGain = null;
    layer.vibratoGain = null;
    layer.breathingGain = null;
    layer.effectGain = null;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      baseFrequency: this.baseFrequency,
      layers: this.layers.map((layer) => ({
        ratio: layer.ratio,
        beatFrequency: layer.beatFrequency,
        volume: layer.volume,
        effect: layer.effect,
      })),
    };
  }

  /**
   * Load a preset configuration
   */
  loadPreset(layers: Array<{ ratio: number; beatFrequency: number; volume: number; effect: HarmonicEffect }>): void {
    // Stop if currently playing
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stopImmediate();
    }

    // Clear and add new layers
    this.clearLayers();
    layers.forEach((layerConfig) => {
      this.addLayer(layerConfig.ratio, layerConfig.beatFrequency, layerConfig.volume, layerConfig.effect);
    });

    // Restart if was playing
    if (wasPlaying) {
      this.start();
    }
  }

  /**
   * Stop immediately without fade (for quick restarts)
   */
  stopImmediate(): void {
    if (!this.isPlaying) return;

    this.layers.forEach((layer) => this.stopLayer(layer));
    this.isPlaying = false;
  }
}
