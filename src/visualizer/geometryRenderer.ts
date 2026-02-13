/**
 * Sacred Geometry Renderer
 * Generates organic yantra/mandala patterns that modulate with frequency
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
  private harmonicRatios: number[] = [];

  constructor(options: GeometryRendererOptions) {
    this.canvas = options.particleCanvas || options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  updateFrequency(frequency: number): void {
    this.frequency = frequency;
  }

  setAmplitude(amplitude: number): void {
    this.amplitude = amplitude;
  }

  setHarmonicRatios(ratios: number[]): void {
    this.harmonicRatios = ratios;
  }

  /**
   * Draw a lotus petal shape using bezier curves
   */
  private drawPetal(cx: number, cy: number, radius: number, angle: number, petalWidth: number, petalLength: number): void {
    const ctx = this.ctx;
    const tipX = cx + Math.cos(angle) * petalLength;
    const tipY = cy + Math.sin(angle) * petalLength;

    // Control points for bezier curve (creates petal shape)
    const perpAngle = angle + Math.PI / 2;
    const baseWidth = petalWidth * radius;

    const cp1x = cx + Math.cos(angle) * petalLength * 0.5 + Math.cos(perpAngle) * baseWidth;
    const cp1y = cy + Math.sin(angle) * petalLength * 0.5 + Math.sin(perpAngle) * baseWidth;
    const cp2x = cx + Math.cos(angle) * petalLength * 0.5 - Math.cos(perpAngle) * baseWidth;
    const cp2y = cy + Math.sin(angle) * petalLength * 0.5 - Math.sin(perpAngle) * baseWidth;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * radius * 0.1, cy + Math.sin(angle) * radius * 0.1);
    ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
    ctx.quadraticCurveTo(cp2x, cp2y, cx + Math.cos(angle) * radius * 0.1, cy + Math.sin(angle) * radius * 0.1);
    ctx.closePath();
  }

  /**
   * Draw a ring of lotus petals
   */
  private drawPetalRing(cx: number, cy: number, innerRadius: number, petalLength: number, count: number, rotation: number, color: string, alpha: number): void {
    const ctx = this.ctx;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rotation;
      this.drawPetal(
        cx + Math.cos(angle) * innerRadius,
        cy + Math.sin(angle) * innerRadius,
        petalLength,
        angle,
        0.35,
        petalLength
      );
      ctx.fillStyle = color.replace('ALPHA', String(alpha * 0.3));
      ctx.fill();
      ctx.strokeStyle = color.replace('ALPHA', String(alpha));
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  /**
   * Draw interlocking triangles (Sri Yantra inspired)
   */
  private drawTriangles(cx: number, cy: number, radius: number, rotation: number, alpha: number): void {
    const ctx = this.ctx;

    // Upward triangles
    for (let i = 0; i < 3; i++) {
      const scale = 1 - i * 0.2;
      const r = radius * scale;
      const rot = rotation + i * 0.15;
      ctx.beginPath();
      for (let j = 0; j < 3; j++) {
        const angle = (j / 3) * Math.PI * 2 - Math.PI / 2 + rot;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(218, 190, 80, ${alpha * 0.8})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Downward triangles
    for (let i = 0; i < 3; i++) {
      const scale = 0.95 - i * 0.2;
      const r = radius * scale;
      const rot = rotation - i * 0.15;
      ctx.beginPath();
      for (let j = 0; j < 3; j++) {
        const angle = (j / 3) * Math.PI * 2 + Math.PI / 2 + rot;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(180, 140, 60, ${alpha * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  /**
   * Draw a concentric ring with optional modulation
   */
  private drawRing(cx: number, cy: number, radius: number, color: string, alpha: number, lineWidth: number = 1, modulation: number = 0, lobes: number = 0): void {
    const ctx = this.ctx;
    ctx.strokeStyle = color.replace('ALPHA', String(alpha));
    ctx.lineWidth = lineWidth;

    if (modulation > 0 && lobes > 0) {
      // Modulated ring (wavy circle)
      ctx.beginPath();
      for (let i = 0; i <= 360; i++) {
        const angle = (i / 360) * Math.PI * 2;
        const mod = 1 + Math.sin(angle * lobes) * modulation;
        const x = cx + Math.cos(angle) * radius * mod;
        const y = cy + Math.sin(angle) * radius * mod;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Draw radial lines emanating from center
   */
  private drawRadials(cx: number, cy: number, innerRadius: number, outerRadius: number, count: number, rotation: number, alpha: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = `rgba(200, 180, 100, ${alpha * 0.3})`;
    ctx.lineWidth = 0.5;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rotation;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerRadius, cy + Math.sin(angle) * innerRadius);
      ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
      ctx.stroke();
    }
  }

  /**
   * Draw dots arranged in a ring
   */
  private drawDotRing(cx: number, cy: number, radius: number, count: number, dotSize: number, rotation: number, color: string, alpha: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = color.replace('ALPHA', String(alpha));

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rotation;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render frame - generates organic mandala/yantra
   */
  render(timestamp: number): void {
    this.time = timestamp * 0.001;

    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.44;

    // Derive symmetry from frequency
    const freqFactor = this.frequency / 432;
    const symmetry = this.getSymmetry();
    const numRings = Math.max(3, Math.min(7, this.harmonicRatios.filter(r => r >= 1).length + 2));

    // Slow organic breathing
    const breathe = Math.sin(this.time * 0.8) * 0.03 + 1.0;
    const breathe2 = Math.sin(this.time * 0.5 + 1.2) * 0.02 + 1.0;

    // Slow rotation speeds (different for each layer)
    const rot1 = this.time * 0.05 * freqFactor;
    const rot2 = -this.time * 0.03 * freqFactor;
    const rot3 = this.time * 0.02 * freqFactor;

    // Base alpha - always visible, amplitude adds reactivity
    const baseAlpha = 0.6;
    const alpha = baseAlpha + this.amplitude * 0.4;

    // === OUTER BOUNDARY ===
    // Outer circle boundary
    this.drawRing(cx, cy, maxRadius * breathe, `rgba(180, 160, 80, ALPHA)`, alpha * 0.5, 2);

    // Modulated outer ring
    this.drawRing(cx, cy, maxRadius * 0.95 * breathe, `rgba(200, 180, 100, ALPHA)`, alpha * 0.3, 1, 0.03, symmetry * 2);

    // === OUTER PETAL RING ===
    this.drawPetalRing(
      cx, cy,
      maxRadius * 0.7 * breathe,
      maxRadius * 0.22,
      symmetry,
      rot1,
      `rgba(218, 190, 80, ALPHA)`,
      alpha * 0.7
    );

    // === MIDDLE RINGS ===
    // Concentric rings at harmonic intervals
    const activeRatios = this.harmonicRatios.filter(r => r >= 1 && r <= 8);
    const maxRatio = Math.max(...activeRatios, 4);

    activeRatios.forEach((ratio, i) => {
      const ringRadius = (ratio / maxRatio) * maxRadius * 0.65 * breathe2;
      if (ringRadius > maxRadius * 0.1 && ringRadius < maxRadius * 0.9) {
        // Ring with subtle modulation
        const lobes = Math.round(ratio) * 2;
        this.drawRing(cx, cy, ringRadius, `rgba(200, 180, 120, ALPHA)`, alpha * 0.4, 1, 0.02, lobes);

        // Dot ring on each harmonic circle
        const dotCount = symmetry * Math.max(1, Math.round(ratio));
        this.drawDotRing(cx, cy, ringRadius, dotCount, 1.5, rot2 + i * 0.3, `rgba(218, 190, 80, ALPHA)`, alpha * 0.5);
      }
    });

    // === INNER PETAL RING ===
    const innerPetalCount = Math.max(6, symmetry);
    this.drawPetalRing(
      cx, cy,
      maxRadius * 0.25 * breathe,
      maxRadius * 0.18,
      innerPetalCount,
      rot2,
      `rgba(220, 200, 100, ALPHA)`,
      alpha * 0.8
    );

    // === RADIAL STRUCTURE ===
    this.drawRadials(cx, cy, maxRadius * 0.15, maxRadius * 0.92 * breathe, symmetry * 2, rot3, alpha);

    // === INTERLOCKING TRIANGLES (Sri Yantra element) ===
    this.drawTriangles(cx, cy, maxRadius * 0.45 * breathe, rot1 * 0.5, alpha * 0.5);

    // === INNER GEOMETRY ===
    // Inner circles
    this.drawRing(cx, cy, maxRadius * 0.15 * breathe, `rgba(218, 190, 80, ALPHA)`, alpha * 0.6, 2);
    this.drawRing(cx, cy, maxRadius * 0.08 * breathe, `rgba(240, 220, 120, ALPHA)`, alpha * 0.4, 1);

    // === CENTRAL BINDU (point) ===
    const binduRadius = maxRadius * 0.04 * breathe;
    const binduGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, binduRadius * 3);
    binduGradient.addColorStop(0, `rgba(255, 230, 140, ${alpha})`);
    binduGradient.addColorStop(0.3, `rgba(218, 190, 80, ${alpha * 0.6})`);
    binduGradient.addColorStop(1, 'rgba(218, 190, 80, 0)');

    ctx.fillStyle = binduGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, binduRadius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Solid bindu center
    ctx.fillStyle = `rgba(255, 240, 180, ${alpha})`;
    ctx.beginPath();
    ctx.arc(cx, cy, binduRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Determine radial symmetry from frequency/harmonics
   */
  private getSymmetry(): number {
    // Use number of active harmonics to influence symmetry
    const activeCount = this.harmonicRatios.filter(r => r >= 1).length;

    // Check for specific sacred numbers in ratios
    const hasTriple = this.harmonicRatios.some(r => Math.abs(r - 3) < 0.1);
    const hasPentagonal = this.harmonicRatios.some(r => Math.abs(r - 5) < 0.1 || Math.abs(r - 1.618) < 0.02);

    if (hasPentagonal) return 10; // 5-fold doubled
    if (hasTriple) return 12; // 6-fold doubled
    if (activeCount >= 5) return 12;
    if (activeCount >= 3) return 8;
    return 6; // Default hexagonal
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  destroy(): void {
    // No resources to clean up
  }
}
