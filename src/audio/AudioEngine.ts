/**
 * Core audio engine managing Web Audio API context and master controls
 */

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;

  /**
   * Initialize the audio context and master gain node
   * Must be called from a user gesture (iOS requirement)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      await this.context?.resume();
      return;
    }

    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.7; // Default master volume

      // Create analyser for visualizations
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect: masterGain -> analyser -> destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.context.destination);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  /**
   * Get the audio context (ensure initialized first)
   */
  getContext(): AudioContext {
    if (!this.context) {
      throw new Error('AudioContext not initialized. Call initialize() first.');
    }
    return this.context;
  }

  /**
   * Get the master gain node for connecting audio sources
   */
  getMasterGain(): GainNode {
    if (!this.masterGain) {
      throw new Error('Master gain not initialized. Call initialize() first.');
    }
    return this.masterGain;
  }

  /**
   * Set master volume with smooth ramping
   */
  setMasterVolume(value: number, rampTime = 0.05): void {
    if (!this.masterGain || !this.context) return;

    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, value)),
      now + rampTime
    );
  }

  /**
   * Get current master volume
   */
  getMasterVolume(): number {
    return this.masterGain?.gain.value ?? 0.7;
  }

  /**
   * Resume audio context (for iOS)
   */
  async resume(): Promise<void> {
    await this.context?.resume();
  }

  /**
   * Suspend audio context
   */
  async suspend(): Promise<void> {
    await this.context?.suspend();
  }

  /**
   * Check if audio engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.context?.state === 'running';
  }

  /**
   * Get current context state
   */
  getState(): AudioContextState | 'uninitialized' {
    return this.context?.state ?? 'uninitialized';
  }

  /**
   * Get analyser node for visualizations
   */
  getAnalyser(): AnalyserNode {
    if (!this.analyser) {
      throw new Error('Analyser not initialized. Call initialize() first.');
    }
    return this.analyser;
  }

  /**
   * Get current audio amplitude (0-1 range)
   */
  getAmplitude(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate RMS amplitude
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // Normalize to 0-1 range
    return Math.min(1, rms / 128);
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
