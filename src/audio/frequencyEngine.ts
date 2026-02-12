/**
 * Frequency player engine for generating pure sine wave tones
 */

import { audioEngine } from './AudioEngine';

export class FrequencyEngine {
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private currentFrequency = 432; // Default to 432Hz
  private currentVolume = 0.5;
  private isPlaying = false;

  /**
   * Start playing the frequency with fade in
   */
  start(frequency: number, volume: number = 0.5): void {
    if (this.isPlaying) {
      this.updateFrequency(frequency);
      this.updateVolume(volume);
      return;
    }

    const context = audioEngine.getContext();
    const masterGain = audioEngine.getMasterGain();

    // Create oscillator and gain node
    this.oscillator = context.createOscillator();
    this.gainNode = context.createGain();

    // Configure oscillator
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = frequency;

    // Configure gain with fade in (start at 0)
    const now = context.currentTime;
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(volume, now + 0.5);

    // Connect nodes
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(masterGain);

    // Start oscillator
    this.oscillator.start();

    this.currentFrequency = frequency;
    this.currentVolume = volume;
    this.isPlaying = true;
  }

  /**
   * Stop playing with fade out
   */
  stop(): void {
    if (!this.isPlaying || !this.oscillator || !this.gainNode) return;

    const context = audioEngine.getContext();
    const now = context.currentTime;

    // Fade out
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

    // Stop and cleanup after fade out
    this.oscillator.stop(now + 0.5);

    setTimeout(() => {
      this.cleanup();
    }, 600);

    this.isPlaying = false;
  }

  /**
   * Update frequency smoothly
   */
  updateFrequency(frequency: number): void {
    if (!this.oscillator || !this.isPlaying) return;

    const context = audioEngine.getContext();
    const now = context.currentTime;

    this.oscillator.frequency.cancelScheduledValues(now);
    this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, now);
    this.oscillator.frequency.linearRampToValueAtTime(frequency, now + 0.1);

    this.currentFrequency = frequency;
  }

  /**
   * Update volume smoothly
   */
  updateVolume(volume: number): void {
    if (!this.gainNode || !this.isPlaying) return;

    const context = audioEngine.getContext();
    const now = context.currentTime;

    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, volume)),
      now + 0.05
    );

    this.currentVolume = volume;
  }

  /**
   * Cleanup nodes
   */
  private cleanup(): void {
    if (this.oscillator) {
      try {
        this.oscillator.disconnect();
      } catch (e) {
        // Already disconnected
      }
      this.oscillator = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {
        // Already disconnected
      }
      this.gainNode = null;
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      frequency: this.currentFrequency,
      volume: this.currentVolume,
    };
  }
}
