/**
 * Ambient texture engine for generating atmospheric background sounds
 */

import { audioEngine } from './AudioEngine';

export type TextureType = 'none' | 'warm-pad' | 'ocean' | 'rain' | 'singing-bowl';

export class TextureEngine {
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoOscillator: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private currentTexture: TextureType = 'none';
  private volume = 0.2;
  private isPlaying = false;

  /**
   * Start playing a texture
   */
  start(texture: TextureType, volume: number = 0.2): void {
    if (texture === 'none') {
      this.stop();
      return;
    }

    if (this.isPlaying && this.currentTexture === texture) {
      this.updateVolume(volume);
      return;
    }

    // Stop current texture if playing
    if (this.isPlaying) {
      this.stop();
    }

    const context = audioEngine.getContext();
    const masterGain = audioEngine.getMasterGain();

    // Generate noise buffer
    const noiseBuffer = this.generateNoiseBuffer(texture);

    // Create source
    this.source = context.createBufferSource();
    this.source.buffer = noiseBuffer;
    this.source.loop = true;

    // Create gain node
    this.gainNode = context.createGain();
    const now = context.currentTime;
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(volume, now + 0.5);

    // Create filter
    this.filterNode = context.createBiquadFilter();
    this.configureFilter(texture);

    // Connect nodes
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);

    // Add LFO modulation for certain textures
    if (texture === 'warm-pad' || texture === 'ocean') {
      this.addLFO(texture);
    }

    this.gainNode.connect(masterGain);

    // Start playback
    this.source.start();

    this.currentTexture = texture;
    this.volume = volume;
    this.isPlaying = true;
  }

  /**
   * Stop texture with fade out
   */
  stop(): void {
    if (!this.isPlaying || !this.gainNode) return;

    const context = audioEngine.getContext();
    const now = context.currentTime;

    // Fade out
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

    // Stop source after fade
    this.source?.stop(now + 0.5);
    this.lfoOscillator?.stop(now + 0.5);

    setTimeout(() => {
      this.cleanup();
    }, 600);

    this.isPlaying = false;
  }

  /**
   * Update volume
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

    this.volume = volume;
  }

  /**
   * Generate noise buffer based on texture type
   */
  private generateNoiseBuffer(texture: TextureType): AudioBuffer {
    const context = audioEngine.getContext();
    const sampleRate = context.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds of noise (looped)

    const buffer = context.createBuffer(2, bufferSize, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);

      switch (texture) {
        case 'warm-pad':
        case 'rain':
          // Pink noise (1/f noise)
          this.generatePinkNoise(channelData);
          break;
        case 'ocean':
          // Brown noise (1/f² noise)
          this.generateBrownNoise(channelData);
          break;
        case 'singing-bowl':
          // Harmonic-rich noise
          this.generateHarmonicNoise(channelData, sampleRate);
          break;
        default:
          // White noise
          this.generateWhiteNoise(channelData);
      }
    }

    return buffer;
  }

  /**
   * Generate white noise
   */
  private generateWhiteNoise(output: Float32Array): void {
    for (let i = 0; i < output.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * Generate pink noise using Paul Kellet's algorithm
   */
  private generatePinkNoise(output: Float32Array): void {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < output.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  /**
   * Generate brown noise
   */
  private generateBrownNoise(output: Float32Array): void {
    let lastOut = 0;
    for (let i = 0; i < output.length; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for volume
    }
  }

  /**
   * Generate harmonic noise for singing bowl effect
   */
  private generateHarmonicNoise(output: Float32Array, sampleRate: number): void {
    const fundamentalFreq = 200; // Hz
    const harmonics = [1, 2.1, 3.2, 4.3, 5.5, 6.8]; // Slightly inharmonic

    for (let i = 0; i < output.length; i++) {
      let sample = 0;
      const t = i / sampleRate;

      harmonics.forEach((harmonic, idx) => {
        const freq = fundamentalFreq * harmonic;
        const amplitude = 1 / (idx + 1); // Decay amplitude with harmonic number
        const decay = Math.exp(-t * (idx + 1) * 0.5); // Decay over time
        sample += Math.sin(2 * Math.PI * freq * t) * amplitude * decay;
      });

      // Add some noise
      sample += (Math.random() * 2 - 1) * 0.05;
      output[i] = sample * 0.3;
    }
  }

  /**
   * Configure filter based on texture type
   */
  private configureFilter(texture: TextureType): void {
    if (!this.filterNode) return;

    switch (texture) {
      case 'warm-pad':
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 800;
        this.filterNode.Q.value = 1;
        break;
      case 'ocean':
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 400;
        this.filterNode.Q.value = 0.5;
        break;
      case 'rain':
        this.filterNode.type = 'bandpass';
        this.filterNode.frequency.value = 2000;
        this.filterNode.Q.value = 1;
        break;
      case 'singing-bowl':
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 1500;
        this.filterNode.Q.value = 2;
        break;
      default:
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 20000;
    }
  }

  /**
   * Add LFO (Low Frequency Oscillator) for modulation
   */
  private addLFO(texture: TextureType): void {
    if (!this.gainNode) return;

    const context = audioEngine.getContext();

    this.lfoOscillator = context.createOscillator();
    this.lfoGain = context.createGain();

    // Configure LFO
    this.lfoOscillator.type = 'sine';
    if (texture === 'warm-pad') {
      this.lfoOscillator.frequency.value = 0.2; // Slow modulation
      this.lfoGain.gain.value = 0.05; // Subtle depth
    } else if (texture === 'ocean') {
      this.lfoOscillator.frequency.value = 0.15; // Wave-like modulation
      this.lfoGain.gain.value = 0.1;
    }

    // Connect LFO to gain
    this.lfoOscillator.connect(this.lfoGain);
    this.lfoGain.connect(this.gainNode.gain);

    this.lfoOscillator.start();
  }

  /**
   * Cleanup nodes
   */
  private cleanup(): void {
    const nodes = [
      this.source,
      this.gainNode,
      this.filterNode,
      this.lfoOscillator,
      this.lfoGain,
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

    this.source = null;
    this.gainNode = null;
    this.filterNode = null;
    this.lfoOscillator = null;
    this.lfoGain = null;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      texture: this.currentTexture,
      volume: this.volume,
    };
  }
}
