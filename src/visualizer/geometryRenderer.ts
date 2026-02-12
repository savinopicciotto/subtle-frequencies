/**
 * Sacred Geometry Renderer
 * Creates beautiful geometric patterns based on golden ratio and sacred geometry
 */

interface GeometryRendererOptions {
  canvas: HTMLCanvasElement;
  particleCanvas?: HTMLCanvasElement;
}

export class GeometryRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private frequency: number = 432;
  private amplitude: number = 0.5;
  private time: number = 0;
  private harmonicRatios: number[] = []; // Active harmonic ratios from audio

  constructor(options: GeometryRendererOptions) {
    // Use particleCanvas for 2D rendering (main canvas may have WebGL context)
    this.canvas = options.particleCanvas || options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context - canvas may already have WebGL context');
    }
    this.ctx = ctx;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
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
   * Update harmonic ratios to visualize
   */
  setHarmonicRatios(ratios: number[]): void {
    this.harmonicRatios = ratios;
  }

  /**
   * Draw Flower of Life pattern
   */
  private drawFlowerOfLife(centerX: number, centerY: number, radius: number, alpha: number): void {
    // Classic Flower of Life has 19 circles
    const positions = [
      { x: 0, y: 0 }, // Center
      // Inner ring (6 circles)
      { x: 1, y: 0 },
      { x: 0.5, y: 0.866 },
      { x: -0.5, y: 0.866 },
      { x: -1, y: 0 },
      { x: -0.5, y: -0.866 },
      { x: 0.5, y: -0.866 },
      // Outer ring (12 circles)
      { x: 2, y: 0 },
      { x: 1.5, y: 0.866 },
      { x: 1, y: 1.732 },
      { x: 0, y: 1.732 },
      { x: -1, y: 1.732 },
      { x: -1.5, y: 0.866 },
      { x: -2, y: 0 },
      { x: -1.5, y: -0.866 },
      { x: -1, y: -1.732 },
      { x: 0, y: -1.732 },
      { x: 1, y: -1.732 },
      { x: 1.5, y: -0.866 },
    ];

    this.ctx.strokeStyle = `rgba(218, 165, 32, ${alpha})`;
    this.ctx.lineWidth = 2;

    positions.forEach((pos) => {
      this.ctx.beginPath();
      this.ctx.arc(
        centerX + pos.x * radius,
        centerY + pos.y * radius,
        radius,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
    });
  }

  /**
   * Draw Metatron's Cube (simplified)
   */
  private drawMetatronsCube(centerX: number, centerY: number, radius: number, alpha: number): void {
    // 13 circles in Fruit of Life pattern
    const positions = [
      { x: 0, y: 0 }, // Center
      // Inner hexagon
      { x: 1, y: 0 },
      { x: 0.5, y: 0.866 },
      { x: -0.5, y: 0.866 },
      { x: -1, y: 0 },
      { x: -0.5, y: -0.866 },
      { x: 0.5, y: -0.866 },
      // Outer points
      { x: 0, y: 1.732 },
      { x: 1.5, y: 0.866 },
      { x: 1.5, y: -0.866 },
      { x: 0, y: -1.732 },
      { x: -1.5, y: -0.866 },
      { x: -1.5, y: 0.866 },
    ];

    // Draw connecting lines between all points
    this.ctx.strokeStyle = `rgba(139, 69, 255, ${alpha * 0.3})`;
    this.ctx.lineWidth = 1;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + positions[i].x * radius, centerY + positions[i].y * radius);
        this.ctx.lineTo(centerX + positions[j].x * radius, centerY + positions[j].y * radius);
        this.ctx.stroke();
      }
    }

    // Draw circles at each point
    this.ctx.strokeStyle = `rgba(139, 69, 255, ${alpha})`;
    this.ctx.lineWidth = 2;
    positions.forEach((pos) => {
      this.ctx.beginPath();
      this.ctx.arc(
        centerX + pos.x * radius,
        centerY + pos.y * radius,
        radius * 0.15,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
    });
  }

  /**
   * Draw Fibonacci Spiral
   */
  private drawFibonacciSpiral(centerX: number, centerY: number, scale: number, alpha: number, rotation: number): void {
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(rotation);

    this.ctx.strokeStyle = `rgba(218, 165, 32, ${alpha})`;
    this.ctx.lineWidth = 3;

    // Draw golden spiral using quarter circles
    const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34];
    let x = 0;
    let y = 0;
    let direction = 0; // 0: right, 1: up, 2: left, 3: down

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    for (let i = 0; i < fibonacci.length - 1; i++) {
      const radius = fibonacci[i] * scale;

      // Calculate arc center and sweep based on direction
      let cx = x;
      let cy = y;
      let startAngle = 0;
      let endAngle = 0;

      switch (direction % 4) {
        case 0: // right -> down
          cx = x + radius;
          cy = y;
          startAngle = Math.PI;
          endAngle = Math.PI * 1.5;
          x = cx;
          y = cy + radius;
          break;
        case 1: // down -> left
          cx = x;
          cy = y + radius;
          startAngle = Math.PI * 1.5;
          endAngle = Math.PI * 2;
          x = cx - radius;
          y = cy;
          break;
        case 2: // left -> up
          cx = x - radius;
          cy = y;
          startAngle = 0;
          endAngle = Math.PI * 0.5;
          x = cx;
          y = cy - radius;
          break;
        case 3: // up -> right
          cx = x;
          cy = y - radius;
          startAngle = Math.PI * 0.5;
          endAngle = Math.PI;
          x = cx + radius;
          y = cy;
          break;
      }

      this.ctx.arc(cx, cy, radius, startAngle, endAngle);
      direction++;
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Detect mathematical patterns in harmonic ratios
   */
  private detectPattern(): 'phi' | 'fibonacci' | 'sacred' | 'generic' {
    const ratios = this.harmonicRatios;
    if (ratios.length === 0) return 'generic';

    // Check for golden ratio (φ ≈ 1.618, φ² ≈ 2.618, φ³ ≈ 4.236)
    const hasPhi = ratios.some(r => Math.abs(r - 1.618) < 0.01 || Math.abs(r - 2.618) < 0.01);
    if (hasPhi) return 'phi';

    // Check for Fibonacci (1, 2, 3, 5, 8, 13...)
    const fibNumbers = [1, 2, 3, 5, 8, 13];
    const isFib = ratios.filter(r => fibNumbers.some(f => Math.abs(r - f) < 0.1)).length >= 3;
    if (isFib) return 'fibonacci';

    // Check for sacred geometry constants (√2, √3, √5)
    const hasSacred = ratios.some(r =>
      Math.abs(r - 1.414) < 0.01 || // √2
      Math.abs(r - 1.732) < 0.01 || // √3
      Math.abs(r - 2.236) < 0.01    // √5
    );
    if (hasSacred) return 'sacred';

    return 'generic';
  }

  /**
   * Render frame - adapts to active harmonic ratios
   */
  render(timestamp: number): void {
    this.time = timestamp * 0.001;

    // Clear with dark background
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const baseRadius = Math.min(this.width, this.height) * 0.15;

    // Animate based on frequency and amplitude
    const freqFactor = this.frequency / 432;
    const pulse = Math.sin(this.time * 2) * 0.1 + 0.9;
    const rotation = this.time * 0.2 * freqFactor;

    // Detect pattern type from active harmonics
    const pattern = this.detectPattern();

    if (pattern === 'phi') {
      // Golden Ratio Visualization
      // Draw multiple golden spirals at φ ratios
      const phiRatios = this.harmonicRatios.filter(r => r >= 1.4 && r <= 7);
      phiRatios.forEach((ratio, i) => {
        const angle = (i / phiRatios.length) * Math.PI * 2 + rotation;
        const distance = baseRadius * ratio * 0.5;
        const spiralX = centerX + Math.cos(angle) * distance;
        const spiralY = centerY + Math.sin(angle) * distance;
        this.drawFibonacciSpiral(spiralX, spiralY, 2.5 * ratio / 3, 0.4 * this.amplitude, angle);
      });

      // Central golden rectangle cascade
      for (let i = 0; i < 5; i++) {
        const scale = Math.pow(1.618, i) * baseRadius * 0.15;
        const alpha = (0.6 - i * 0.1) * this.amplitude;
        this.ctx.strokeStyle = `rgba(218, 165, 32, ${alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(rotation + i * 0.3);
        this.ctx.strokeRect(-scale, -scale * 0.618, scale * 2, scale * 1.236);
        this.ctx.restore();
      }
    } else if (pattern === 'fibonacci') {
      // Fibonacci Sequence Visualization
      // Draw Fibonacci spiral from center
      this.drawFibonacciSpiral(centerX, centerY, 3, 0.7 * this.amplitude, rotation);

      // Draw circles at Fibonacci distances
      const fibSequence = [1, 2, 3, 5, 8];
      fibSequence.forEach((fib) => {
        if (this.harmonicRatios.some(r => Math.abs(r - fib) < 0.2)) {
          const radius = baseRadius * fib * 0.3 * pulse;
          const alpha = 0.3 * this.amplitude;
          this.ctx.strokeStyle = `rgba(218, 165, 32, ${alpha})`;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      });
    } else if (pattern === 'sacred') {
      // Sacred Geometry (√2, √3, √5)
      this.drawFlowerOfLife(centerX, centerY, baseRadius * pulse, 0.5 * this.amplitude);

      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(rotation);
      this.ctx.translate(-centerX, -centerY);
      this.drawMetatronsCube(centerX, centerY, baseRadius * 1.3 * pulse, 0.6 * this.amplitude);
      this.ctx.restore();
    } else {
      // Generic: Draw circles at each harmonic ratio distance
      this.harmonicRatios.forEach((ratio, i) => {
        if (ratio < 1) return; // Skip subharmonics for clarity
        const radius = baseRadius * ratio * 0.4 * pulse;
        const hue = (i * 40 + this.time * 20) % 360;
        const alpha = 0.5 * this.amplitude;
        this.ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.min(radius, this.width * 0.45), 0, Math.PI * 2);
        this.ctx.stroke();
      });
    }

    // Central glow pulse
    const glowRadius = baseRadius * 0.3 * pulse * this.amplitude;
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius * 3);
    gradient.addColorStop(0, `rgba(218, 165, 32, ${0.8 * this.amplitude})`);
    gradient.addColorStop(0.5, `rgba(218, 165, 32, ${0.3 * this.amplitude})`);
    gradient.addColorStop(1, 'rgba(218, 165, 32, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, glowRadius * 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // No resources to clean up
  }
}
