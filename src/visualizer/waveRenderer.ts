/**
 * Wave Interference Renderer
 * Creates beautiful interference patterns from multiple wave sources
 */

interface WaveSource {
  x: number;
  y: number;
  phase: number;
  speed: number;
}

interface WaveRendererOptions {
  canvas: HTMLCanvasElement;
  particleCanvas?: HTMLCanvasElement;
  sourceCount?: number;
}

export class WaveRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private frequency: number = 432;
  private amplitude: number = 0.5;
  private sources: WaveSource[] = [];
  private time: number = 0;

  constructor(options: WaveRendererOptions) {
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Initialize wave sources
    const sourceCount = options.sourceCount || 3;
    this.initializeSources(sourceCount);
  }

  /**
   * Initialize wave sources at interesting positions
   */
  private initializeSources(count: number): void {
    this.sources = [];
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.3;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.sources.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
  }

  /**
   * Update frequency
   */
  updateFrequency(frequency: number): void {
    this.frequency = frequency;
  }

  /**
   * Set amplitude (from audio)
   */
  setAmplitude(amplitude: number): void {
    this.amplitude = amplitude;
  }

  /**
   * Calculate wave interference at a point
   */
  private calculateInterference(x: number, y: number, time: number): number {
    let sum = 0;
    const wavelength = 50 + (1000 - this.frequency) * 0.05; // Higher freq = shorter wavelength

    for (const source of this.sources) {
      const dx = x - source.x;
      const dy = y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const wave = Math.sin((distance / wavelength - time * source.speed) * Math.PI * 2 + source.phase);
      sum += wave;
    }

    return sum / this.sources.length;
  }

  /**
   * Render frame
   */
  render(timestamp: number): void {
    this.time = timestamp * 0.001; // Convert to seconds

    // Clear canvas
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Calculate stride for performance (sample every N pixels)
    const stride = 2;

    // Create image data for direct pixel manipulation
    const imageData = this.ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let y = 0; y < this.height; y += stride) {
      for (let x = 0; x < this.width; x += stride) {
        // Calculate interference pattern
        const interference = this.calculateInterference(x, y, this.time);

        // Map interference to color
        const intensity = (interference + 1) * 0.5; // Normalize to 0-1
        const amplifiedIntensity = Math.pow(intensity, 1.5) * this.amplitude;

        // Color gradient: deep blue -> cyan -> white
        let r, g, b;
        if (amplifiedIntensity < 0.3) {
          // Deep blue to blue
          r = 10 + amplifiedIntensity * 50;
          g = 20 + amplifiedIntensity * 80;
          b = 40 + amplifiedIntensity * 200;
        } else if (amplifiedIntensity < 0.6) {
          // Blue to cyan
          const t = (amplifiedIntensity - 0.3) / 0.3;
          r = 25 + t * 75;
          g = 44 + t * 156;
          b = 100 + t * 155;
        } else {
          // Cyan to white
          const t = (amplifiedIntensity - 0.6) / 0.4;
          r = 100 + t * 155;
          g = 200 + t * 55;
          b = 255;
        }

        // Fill stride x stride block
        for (let dy = 0; dy < stride && y + dy < this.height; dy++) {
          for (let dx = 0; dx < stride && x + dx < this.width; dx++) {
            const index = ((y + dy) * this.width + (x + dx)) * 4;
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = 255;
          }
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);

    // Draw wave source indicators with glow
    this.sources.forEach((source) => {
      const pulse = Math.sin(this.time * 2 + source.phase) * 0.3 + 0.7;
      const radius = 8 * pulse * this.amplitude;

      // Outer glow
      const gradient = this.ctx.createRadialGradient(source.x, source.y, 0, source.x, source.y, radius * 3);
      gradient.addColorStop(0, `rgba(100, 200, 255, ${0.6 * this.amplitude})`);
      gradient.addColorStop(0.5, `rgba(100, 200, 255, ${0.2 * this.amplitude})`);
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(source.x, source.y, radius * 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Core
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * this.amplitude})`;
      this.ctx.beginPath();
      this.ctx.arc(source.x, source.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    // Reposition sources
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    this.sources.forEach((source, i) => {
      const angle = (i / this.sources.length) * Math.PI * 2;
      source.x = centerX + Math.cos(angle) * radius;
      source.y = centerY + Math.sin(angle) * radius;
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // No resources to clean up
  }
}
