/**
 * Binaural beats engine for creating brainwave entrainment
 * Plays two slightly different frequencies (left/right ear) to create the beat effect
 */

import { audioEngine } from './AudioEngine';

export type BrainwaveState = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma' | 'custom';

export const BRAINWAVE_PRESETS: Record<BrainwaveState, number> = {
  delta: 2, // 0.5-4 Hz - Deep Sleep
  theta: 6, // 4-8 Hz - Meditation
  alpha: 10, // 8-14 Hz - Relaxation
  beta: 20, // 14-30 Hz - Focus
  gamma: 40, // 30-50 Hz - Peak Awareness
  custom: 10, // Default for custom
};

export class BinauralEngine {
  private leftOscillator: OscillatorNode | null = null;
  private rightOscillator: OscillatorNode | null = null;
  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private leftPanner: StereoPannerNode | null = null;
  private rightPanner: StereoPannerNode | null = null;

  private baseFrequency = 200; // Base carrier frequency
  private beatFrequency = 10; // Hz difference between ears
  private volume = 0.3;
  private isPlaying = false;

  /**
   * Start binaural beats
   */
  start(baseFreq: number, beatFreq: number, volume: number = 0.3): void {
    if (this.isPlaying) {
      this.update(baseFreq, beatFreq, volume);
      return;
    }

    const context = audioEngine.getContext();
    const masterGain = audioEngine.getMasterGain();

    // Create oscillators
    this.leftOscillator = context.createOscillator();
    this.rightOscillator = context.createOscillator();

    // Create gain nodes
    this.leftGain = context.createGain();
    this.rightGain = context.createGain();

    // Create stereo panners
    this.leftPanner = context.createStereoPanner();
    this.rightPanner = context.createStereoPanner();

    // Configure oscillators
    this.leftOscillator.type = 'sine';
    this.rightOscillator.type = 'sine';
    this.leftOscillator.frequency.value = baseFreq;
    this.rightOscillator.frequency.value = baseFreq + beatFreq;

    // Pan hard left and right
    this.leftPanner.pan.value = -1;
    this.rightPanner.pan.value = 1;

    // Configure gains with fade in
    const now = context.currentTime;
    this.leftGain.gain.setValueAtTime(0, now);
    this.rightGain.gain.setValueAtTime(0, now);
    this.leftGain.gain.linearRampToValueAtTime(volume, now + 0.5);
    this.rightGain.gain.linearRampToValueAtTime(volume, now + 0.5);

    // Connect left channel
    this.leftOscillator.connect(this.leftGain);
    this.leftGain.connect(this.leftPanner);
    this.leftPanner.connect(masterGain);

    // Connect right channel
    this.rightOscillator.connect(this.rightGain);
    this.rightGain.connect(this.rightPanner);
    this.rightPanner.connect(masterGain);

    // Start oscillators
    this.leftOscillator.start();
    this.rightOscillator.start();

    this.baseFrequency = baseFreq;
    this.beatFrequency = beatFreq;
    this.volume = volume;
    this.isPlaying = true;
  }

  /**
   * Stop binaural beats with fade out
   */
  stop(): void {
    if (!this.isPlaying || !this.leftGain || !this.rightGain) return;

    const context = audioEngine.getContext();
    const now = context.currentTime;

    // Fade out
    this.leftGain.gain.cancelScheduledValues(now);
    this.rightGain.gain.cancelScheduledValues(now);
    this.leftGain.gain.setValueAtTime(this.leftGain.gain.value, now);
    this.rightGain.gain.setValueAtTime(this.rightGain.gain.value, now);
    this.leftGain.gain.linearRampToValueAtTime(0, now + 0.5);
    this.rightGain.gain.linearRampToValueAtTime(0, now + 0.5);

    // Stop oscillators after fade
    this.leftOscillator?.stop(now + 0.5);
    this.rightOscillator?.stop(now + 0.5);

    setTimeout(() => {
      this.cleanup();
    }, 600);

    this.isPlaying = false;
  }

  /**
   * Update binaural beat parameters
   */
  update(baseFreq: number, beatFreq: number, volume: number): void {
    if (!this.isPlaying) return;

    const context = audioEngine.getContext();
    const now = context.currentTime;

    // Update frequencies
    if (this.leftOscillator && this.rightOscillator) {
      this.leftOscillator.frequency.cancelScheduledValues(now);
      this.rightOscillator.frequency.cancelScheduledValues(now);
      this.leftOscillator.frequency.setValueAtTime(this.leftOscillator.frequency.value, now);
      this.rightOscillator.frequency.setValueAtTime(this.rightOscillator.frequency.value, now);
      this.leftOscillator.frequency.linearRampToValueAtTime(baseFreq, now + 0.1);
      this.rightOscillator.frequency.linearRampToValueAtTime(baseFreq + beatFreq, now + 0.1);
    }

    // Update volume
    if (this.leftGain && this.rightGain) {
      this.leftGain.gain.cancelScheduledValues(now);
      this.rightGain.gain.cancelScheduledValues(now);
      this.leftGain.gain.setValueAtTime(this.leftGain.gain.value, now);
      this.rightGain.gain.setValueAtTime(this.rightGain.gain.value, now);
      this.leftGain.gain.linearRampToValueAtTime(volume, now + 0.05);
      this.rightGain.gain.linearRampToValueAtTime(volume, now + 0.05);
    }

    this.baseFrequency = baseFreq;
    this.beatFrequency = beatFreq;
    this.volume = volume;
  }

  /**
   * Cleanup nodes
   */
  private cleanup(): void {
    const nodes = [
      this.leftOscillator,
      this.rightOscillator,
      this.leftGain,
      this.rightGain,
      this.leftPanner,
      this.rightPanner,
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

    this.leftOscillator = null;
    this.rightOscillator = null;
    this.leftGain = null;
    this.rightGain = null;
    this.leftPanner = null;
    this.rightPanner = null;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      baseFrequency: this.baseFrequency,
      beatFrequency: this.beatFrequency,
      volume: this.volume,
    };
  }
}
