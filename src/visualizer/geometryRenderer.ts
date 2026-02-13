/**
 * Sacred Geometry / Yantra Renderer
 *
 * Maps frequencies to the chakra yantra system:
 * - Each chakra has specific geometry (petal count, central shape, element)
 * - Frequencies smoothly morph between yantra forms
 * - Colors shift from earth tones (root) to ethereal (crown)
 * - Organic breathing and slow rotation throughout
 */

interface GeometryRendererOptions {
  canvas: HTMLCanvasElement;
  particleCanvas?: HTMLCanvasElement;
}

interface ChakraState {
  petals: number;
  centralVertices: number; // 4=square, 3=triangle, 6=hexagram, 0=circle, 1=bindu
  rings: number;
  gateStyle: number; // 1=square bhupura, 0.5=partial, 0=open circle
  color: { r: number; g: number; b: number };
  innerColor: { r: number; g: number; b: number };
  rotSpeed: number;
  complexity: number; // 0-1, how intricate the details are
}

// Chakra definitions mapped to frequency ranges
const CHAKRAS: { freq: number; state: ChakraState }[] = [
  {
    // Muladhara (Root) — Earth, grounding, stability
    freq: 120,
    state: {
      petals: 4, centralVertices: 4, rings: 2, gateStyle: 1,
      color: { r: 220, g: 50, b: 30 }, innerColor: { r: 240, g: 180, b: 50 },
      rotSpeed: 0.02, complexity: 0.2,
    },
  },
  {
    // Svadhisthana (Sacral) — Water, flow, creativity
    freq: 300,
    state: {
      petals: 6, centralVertices: 0, rings: 3, gateStyle: 0.7,
      color: { r: 240, g: 140, b: 30 }, innerColor: { r: 255, g: 200, b: 60 },
      rotSpeed: 0.03, complexity: 0.35,
    },
  },
  {
    // Manipura (Solar Plexus) — Fire, power, transformation
    freq: 450,
    state: {
      petals: 10, centralVertices: 3, rings: 3, gateStyle: 0.4,
      color: { r: 250, g: 210, b: 30 }, innerColor: { r: 255, g: 240, b: 100 },
      rotSpeed: 0.04, complexity: 0.5,
    },
  },
  {
    // Anahata (Heart) — Air, love, connection
    freq: 580,
    state: {
      petals: 12, centralVertices: 6, rings: 4, gateStyle: 0.2,
      color: { r: 50, g: 220, b: 100 }, innerColor: { r: 140, g: 255, b: 160 },
      rotSpeed: 0.035, complexity: 0.65,
    },
  },
  {
    // Vishuddha (Throat) — Ether, expression, truth
    freq: 720,
    state: {
      petals: 16, centralVertices: 0, rings: 5, gateStyle: 0.1,
      color: { r: 40, g: 150, b: 255 }, innerColor: { r: 120, g: 200, b: 255 },
      rotSpeed: 0.03, complexity: 0.8,
    },
  },
  {
    // Ajna (Third Eye) — Mind, intuition, insight
    freq: 870,
    state: {
      petals: 2, centralVertices: 3, rings: 3, gateStyle: 0,
      color: { r: 140, g: 60, b: 255 }, innerColor: { r: 200, g: 150, b: 255 },
      rotSpeed: 0.025, complexity: 0.7,
    },
  },
  {
    // Sahasrara (Crown) — Consciousness, unity, transcendence
    freq: 1000,
    state: {
      petals: 24, centralVertices: 1, rings: 6, gateStyle: 0,
      color: { r: 200, g: 160, b: 255 }, innerColor: { r: 255, g: 245, b: 255 },
      rotSpeed: 0.015, complexity: 1.0,
    },
  },
];

export class GeometryRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private frequency: number = 432;
  private amplitude: number = 0.5;
  private time: number = 0;
  private harmonicRatios: number[] = [];

  // Smoothly interpolated current state
  private current: ChakraState;
  private target: ChakraState;

  constructor(options: GeometryRendererOptions) {
    this.canvas = options.particleCanvas || options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Initialize to default state
    const defaultState = this.getChakraState(432);
    this.current = { ...defaultState };
    this.target = { ...defaultState };
  }

  updateFrequency(frequency: number): void {
    this.frequency = frequency;
    this.target = this.getChakraState(frequency);
  }

  setAmplitude(amplitude: number): void {
    this.amplitude = amplitude;
  }

  setHarmonicRatios(ratios: number[]): void {
    this.harmonicRatios = ratios;
  }

  /**
   * Interpolate between two chakra states based on frequency position
   */
  private getChakraState(freq: number): ChakraState {
    const clampedFreq = Math.max(20, Math.min(freq, 2000));

    // Find surrounding chakras
    let lower = CHAKRAS[0];
    let upper = CHAKRAS[CHAKRAS.length - 1];

    for (let i = 0; i < CHAKRAS.length - 1; i++) {
      if (clampedFreq >= CHAKRAS[i].freq && clampedFreq <= CHAKRAS[i + 1].freq) {
        lower = CHAKRAS[i];
        upper = CHAKRAS[i + 1];
        break;
      }
    }

    // Below lowest or above highest
    if (clampedFreq <= CHAKRAS[0].freq) return { ...CHAKRAS[0].state };
    if (clampedFreq >= CHAKRAS[CHAKRAS.length - 1].freq) return { ...CHAKRAS[CHAKRAS.length - 1].state };

    // Smooth interpolation factor
    const t = (clampedFreq - lower.freq) / (upper.freq - lower.freq);
    // Smooth step for more organic transitions
    const st = t * t * (3 - 2 * t);

    return {
      petals: this.lerpRound(lower.state.petals, upper.state.petals, st),
      centralVertices: this.lerpRound(lower.state.centralVertices, upper.state.centralVertices, st),
      rings: this.lerpRound(lower.state.rings, upper.state.rings, st),
      gateStyle: this.lerp(lower.state.gateStyle, upper.state.gateStyle, st),
      color: this.lerpColor(lower.state.color, upper.state.color, st),
      innerColor: this.lerpColor(lower.state.innerColor, upper.state.innerColor, st),
      rotSpeed: this.lerp(lower.state.rotSpeed, upper.state.rotSpeed, st),
      complexity: this.lerp(lower.state.complexity, upper.state.complexity, st),
    };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpRound(a: number, b: number, t: number): number {
    return Math.round(a + (b - a) * t);
  }

  private lerpColor(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  /**
   * Smoothly animate current state toward target
   * Uses float intermediates — only round at render time
   */
  private updateState(dt: number): void {
    const speed = Math.min(dt * 4.0, 0.3); // Much faster morph

    // Lerp all values as floats (no rounding here!)
    this.current.petals += (this.target.petals - this.current.petals) * speed;
    this.current.centralVertices += (this.target.centralVertices - this.current.centralVertices) * speed;
    this.current.rings += (this.target.rings - this.current.rings) * speed;
    this.current.gateStyle += (this.target.gateStyle - this.current.gateStyle) * speed;
    this.current.color = {
      r: this.current.color.r + (this.target.color.r - this.current.color.r) * speed,
      g: this.current.color.g + (this.target.color.g - this.current.color.g) * speed,
      b: this.current.color.b + (this.target.color.b - this.current.color.b) * speed,
    };
    this.current.innerColor = {
      r: this.current.innerColor.r + (this.target.innerColor.r - this.current.innerColor.r) * speed,
      g: this.current.innerColor.g + (this.target.innerColor.g - this.current.innerColor.g) * speed,
      b: this.current.innerColor.b + (this.target.innerColor.b - this.current.innerColor.b) * speed,
    };
    this.current.rotSpeed += (this.target.rotSpeed - this.current.rotSpeed) * speed;
    this.current.complexity += (this.target.complexity - this.current.complexity) * speed;
  }

  // ========== DRAWING PRIMITIVES ==========

  private rgba(color: { r: number; g: number; b: number }, alpha: number): string {
    return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  /**
   * Draw a polygon with n sides (morphs between shapes)
   * vertices=0 draws circle, vertices=1 draws point, 3=triangle, 4=square, 6=hexagram
   */
  private drawCentralShape(cx: number, cy: number, radius: number, vertices: number, rotation: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.rgba(color, alpha);
    ctx.lineWidth = 2;

    if (vertices <= 1) {
      // Bindu / point — draw small filled circle
      ctx.fillStyle = this.rgba(color, alpha * 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      return;
    }

    if (vertices === 6) {
      // Hexagram (Star of David) — two interlocking triangles
      for (let t = 0; t < 2; t++) {
        const offset = t === 0 ? -Math.PI / 2 : Math.PI / 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 + offset + rotation;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = this.rgba(color, alpha * (t === 0 ? 0.9 : 0.7));
        ctx.stroke();
      }
      return;
    }

    // Regular polygon (circle when vertices is very high or 0)
    if (vertices === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    const n = Math.max(3, vertices);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2 + rotation;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * Draw lotus petal ring
   */
  private drawPetalRing(cx: number, cy: number, innerRadius: number, petalLength: number, count: number, rotation: number, color: { r: number; g: number; b: number }, alpha: number): void {
    if (count < 1) return;
    const ctx = this.ctx;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rotation;
      const baseX = cx + Math.cos(angle) * innerRadius;
      const baseY = cy + Math.sin(angle) * innerRadius;
      const tipX = baseX + Math.cos(angle) * petalLength;
      const tipY = baseY + Math.sin(angle) * petalLength;

      const perpAngle = angle + Math.PI / 2;
      const width = petalLength * 0.35;

      const cp1x = baseX + Math.cos(angle) * petalLength * 0.5 + Math.cos(perpAngle) * width;
      const cp1y = baseY + Math.sin(angle) * petalLength * 0.5 + Math.sin(perpAngle) * width;
      const cp2x = baseX + Math.cos(angle) * petalLength * 0.5 - Math.cos(perpAngle) * width;
      const cp2y = baseY + Math.sin(angle) * petalLength * 0.5 - Math.sin(perpAngle) * width;

      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
      ctx.quadraticCurveTo(cp2x, cp2y, baseX, baseY);
      ctx.closePath();

      ctx.fillStyle = this.rgba(color, alpha * 0.2);
      ctx.fill();
      ctx.strokeStyle = this.rgba(color, alpha);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  /**
   * Draw bhupura (square enclosure with gates) that morphs to circle
   */
  private drawBhupura(cx: number, cy: number, radius: number, gateStyle: number, rotation: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;

    if (gateStyle < 0.05) {
      // Pure circle
      ctx.strokeStyle = this.rgba(color, alpha * 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    // Blend between square and circle
    ctx.strokeStyle = this.rgba(color, alpha * 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();

    const steps = 360;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2 + rotation;
      // Circle radius
      const circR = radius;
      // Square radius (distance from center to edge of square at this angle)
      const absC = Math.abs(Math.cos(angle - rotation));
      const absS = Math.abs(Math.sin(angle - rotation));
      const sqR = radius / Math.max(absC, absS);
      const clampedSqR = Math.min(sqR, radius * 1.42); // Don't exceed corners

      const r = this.lerp(circR, clampedSqR, gateStyle);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Gate indentations on cardinal directions
    if (gateStyle > 0.3) {
      const gateAlpha = (gateStyle - 0.3) / 0.7;
      ctx.strokeStyle = this.rgba(color, alpha * 0.4 * gateAlpha);
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 4; g++) {
        const gAngle = (g / 4) * Math.PI * 2 + rotation;
        const gateWidth = radius * 0.12;
        const gateDepth = radius * 0.08 * gateStyle;
        const perpA = gAngle + Math.PI / 2;

        const outerR = radius * (gateStyle > 0.5 ? 1.2 : 1.05);
        const gx = cx + Math.cos(gAngle) * outerR;
        const gy = cy + Math.sin(gAngle) * outerR;

        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(perpA) * gateWidth, gy + Math.sin(perpA) * gateWidth);
        ctx.lineTo(gx + Math.cos(gAngle) * gateDepth + Math.cos(perpA) * gateWidth * 0.6,
                   gy + Math.sin(gAngle) * gateDepth + Math.sin(perpA) * gateWidth * 0.6);
        ctx.lineTo(gx + Math.cos(gAngle) * gateDepth - Math.cos(perpA) * gateWidth * 0.6,
                   gy + Math.sin(gAngle) * gateDepth - Math.sin(perpA) * gateWidth * 0.6);
        ctx.lineTo(gx - Math.cos(perpA) * gateWidth, gy - Math.sin(perpA) * gateWidth);
        ctx.stroke();
      }
    }
  }

  /**
   * Draw concentric rings
   */
  private drawConcentricRings(cx: number, cy: number, maxRadius: number, count: number, breathe: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const radius = maxRadius * t * breathe;
      ctx.strokeStyle = this.rgba(color, alpha * (0.2 + t * 0.3));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Draw radiating lines
   */
  private drawRadials(cx: number, cy: number, innerR: number, outerR: number, count: number, rotation: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.rgba(color, alpha * 0.2);
    ctx.lineWidth = 0.5;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rotation;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();
    }
  }

  /**
   * Draw dot ring
   */
  private drawDots(cx: number, cy: number, radius: number, count: number, dotSize: number, rotation: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.rgba(color, alpha);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rotation;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw central bindu with glow
   */
  private drawBindu(cx: number, cy: number, radius: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    const glowR = radius * 4;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    gradient.addColorStop(0, this.rgba(color, alpha));
    gradient.addColorStop(0.3, this.rgba(color, alpha * 0.5));
    gradient.addColorStop(1, this.rgba(color, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Solid center
    ctx.fillStyle = this.rgba({ r: 255, g: 250, b: 230 }, alpha);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ========== MAIN RENDER ==========

  render(timestamp: number): void {
    const dt = this.time ? (timestamp * 0.001 - this.time) : 0.016;
    this.time = timestamp * 0.001;

    // Smoothly morph current state toward target
    this.updateState(Math.min(dt, 0.05));

    const ctx = this.ctx;
    const s = this.current;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxR = Math.min(this.width, this.height) * 0.44;

    // Breathing animations
    const breathe = Math.sin(this.time * 0.8) * 0.025 + 1.0;
    const breathe2 = Math.sin(this.time * 0.5 + 1.0) * 0.02 + 1.0;

    // Layer rotations
    const rot1 = this.time * s.rotSpeed;
    const rot2 = -this.time * s.rotSpeed * 0.7;
    const rot3 = this.time * s.rotSpeed * 0.4;

    // Alpha: always visible, amplitude adds reactivity
    const alpha = 0.6 + this.amplitude * 0.4;

    // Dimmer secondary color
    const dimColor = {
      r: Math.round(s.color.r * 0.6),
      g: Math.round(s.color.g * 0.6),
      b: Math.round(s.color.b * 0.6),
    };

    // === LAYER 1: Bhupura (outer enclosure) ===
    this.drawBhupura(cx, cy, maxR * breathe, s.gateStyle, rot3 * 0.3, dimColor, alpha);

    // Round discrete values at render time (stored as floats for smooth lerp)
    const petals = Math.max(2, Math.round(s.petals));
    const centralVerts = Math.round(s.centralVertices);
    const rings = Math.max(1, Math.round(s.rings));

    // === LAYER 2: Outer petal ring ===
    this.drawPetalRing(
      cx, cy,
      maxR * 0.68 * breathe,
      maxR * 0.22,
      petals,
      rot1,
      s.color,
      alpha * 0.7,
    );

    // === LAYER 3: Concentric rings ===
    this.drawConcentricRings(cx, cy, maxR * 0.65, rings, breathe2, dimColor, alpha);

    // === LAYER 4: Radial structure ===
    const radialCount = petals * 2;
    this.drawRadials(cx, cy, maxR * 0.12, maxR * 0.9 * breathe, radialCount, rot3, dimColor, alpha);

    // === LAYER 5: Inner petal ring (smaller, counter-rotating) ===
    const innerPetals = Math.max(2, Math.round(petals * 0.6));
    this.drawPetalRing(
      cx, cy,
      maxR * 0.28 * breathe,
      maxR * 0.16,
      innerPetals,
      rot2,
      s.innerColor,
      alpha * 0.8,
    );

    // === LAYER 6: Dot rings at complexity-dependent positions ===
    if (s.complexity > 0.3) {
      this.drawDots(cx, cy, maxR * 0.55 * breathe, petals, 2, rot1 * 0.5, s.color, alpha * 0.5);
    }
    if (s.complexity > 0.6) {
      this.drawDots(cx, cy, maxR * 0.82 * breathe, radialCount, 1.5, rot2, dimColor, alpha * 0.4);
    }

    // === LAYER 7: Central yantra shape ===
    this.drawCentralShape(
      cx, cy,
      maxR * 0.22 * breathe,
      centralVerts,
      rot1 * 0.3,
      s.innerColor,
      alpha * 0.9,
    );

    // Smaller inner shape (rotated offset)
    if (centralVerts >= 3) {
      this.drawCentralShape(
        cx, cy,
        maxR * 0.16 * breathe,
        centralVerts,
        -rot1 * 0.3 + Math.PI / centralVerts,
        s.innerColor,
        alpha * 0.5,
      );
    }

    // === LAYER 8: Inner circle ===
    ctx.strokeStyle = this.rgba(s.innerColor, alpha * 0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.1 * breathe, 0, Math.PI * 2);
    ctx.stroke();

    // === LAYER 9: Central bindu ===
    this.drawBindu(cx, cy, maxR * 0.03 * breathe, s.innerColor, alpha);
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
