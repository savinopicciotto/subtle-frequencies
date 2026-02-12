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

  constructor(options: GeometryRendererOptions) {
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext('2d')!;
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
   * Draw Sri Yantra (simplified version)
   */
  private drawSriYantra(centerX: number, centerY: number, radius: number, alpha: number, rotation: number): void {
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(rotation);

    // Upward pointing triangles (Shiva)
    this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 4; i++) {
      const scale = 1 - i * 0.2;
      const r = radius * scale;
      const h = r * Math.sqrt(3) / 2;

      this.ctx.beginPath();
      this.ctx.moveTo(0, -h * 0.667);
      this.ctx.lineTo(-r / 2, h * 0.333);
      this.ctx.lineTo(r / 2, h * 0.333);
      this.ctx.closePath();
      this.ctx.stroke();
    }

    // Downward pointing triangles (Shakti)
    this.ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`;

    for (let i = 0; i < 5; i++) {
      const scale = 0.9 - i * 0.18;
      const r = radius * scale;
      const h = r * Math.sqrt(3) / 2;

      this.ctx.beginPath();
      this.ctx.moveTo(0, h * 0.667);
      this.ctx.lineTo(-r / 2, -h * 0.333);
      this.ctx.lineTo(r / 2, -h * 0.333);
      this.ctx.closePath();
      this.ctx.stroke();
    }

    this.ctx.restore();

    // Outer circles
    this.ctx.strokeStyle = `rgba(218, 165, 32, ${alpha})`;
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius * (1 + i * 0.1), 0, Math.PI * 2);
      this.ctx.stroke();
    }
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
   * Render frame
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
    const freqFactor = this.frequency / 432; // Normalize to 432 Hz
    const pulse = Math.sin(this.time * 2) * 0.1 + 0.9;
    const rotation = this.time * 0.2 * freqFactor;

    // Layer 1: Rotating Flower of Life (background)
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(rotation * 0.3);
    this.ctx.translate(-centerX, -centerY);
    this.drawFlowerOfLife(centerX, centerY, baseRadius * 0.8 * pulse, 0.2 * this.amplitude);
    this.ctx.restore();

    // Layer 2: Metatron's Cube (middle)
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(-rotation * 0.5);
    this.ctx.translate(-centerX, -centerY);
    this.drawMetatronsCube(centerX, centerY, baseRadius * 1.2 * pulse, 0.4 * this.amplitude);
    this.ctx.restore();

    // Layer 3: Sri Yantra (center)
    this.drawSriYantra(centerX, centerY, baseRadius * pulse, 0.6 * this.amplitude, rotation);

    // Layer 4: Fibonacci Spirals (dynamic)
    const spiralCount = 4;
    for (let i = 0; i < spiralCount; i++) {
      const angle = (i / spiralCount) * Math.PI * 2 + rotation * 2;
      const distance = baseRadius * 2;
      const spiralX = centerX + Math.cos(angle) * distance;
      const spiralY = centerY + Math.sin(angle) * distance;
      this.drawFibonacciSpiral(spiralX, spiralY, 2, 0.3 * this.amplitude, angle);
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
