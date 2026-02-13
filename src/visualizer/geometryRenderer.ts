/**
 * Sacred Geometry / Yantra Renderer
 *
 * Maps frequencies to chakra yantra system with authentic sacred geometry forms:
 * - Root: Seed of Life (7 overlapping circles) + 4 petals
 * - Sacral: Flower of Life emerging + 6 petals
 * - Solar Plexus: Full Flower of Life + downward triangle + 10 petals
 * - Heart: Sri Yantra (interlocking triangles) + hexagram + 12 petals
 * - Throat: Metatron's Cube + 16 petals
 * - Third Eye: Merkaba (3D star tetrahedron) + 2 petals
 * - Crown: Full mandala with golden spiral + 24 petals
 */

interface GeometryRendererOptions {
  canvas: HTMLCanvasElement;
  particleCanvas?: HTMLCanvasElement;
}

interface ChakraState {
  petals: number;
  centralVertices: number;
  rings: number;
  gateStyle: number;
  color: { r: number; g: number; b: number };
  innerColor: { r: number; g: number; b: number };
  rotSpeed: number;
  complexity: number;
  sacredForm: number; // 0=seed, 1=flower, 2=sri yantra, 3=metatron, 4=merkaba, 5=mandala
}

const CHAKRAS: { freq: number; state: ChakraState }[] = [
  {
    freq: 120,
    state: {
      petals: 4, centralVertices: 4, rings: 2, gateStyle: 1,
      color: { r: 220, g: 50, b: 30 }, innerColor: { r: 240, g: 180, b: 50 },
      rotSpeed: 0.02, complexity: 0.2, sacredForm: 0,
    },
  },
  {
    freq: 300,
    state: {
      petals: 6, centralVertices: 0, rings: 3, gateStyle: 0.7,
      color: { r: 240, g: 140, b: 30 }, innerColor: { r: 255, g: 200, b: 60 },
      rotSpeed: 0.03, complexity: 0.35, sacredForm: 0.8,
    },
  },
  {
    freq: 450,
    state: {
      petals: 10, centralVertices: 3, rings: 3, gateStyle: 0.4,
      color: { r: 250, g: 210, b: 30 }, innerColor: { r: 255, g: 240, b: 100 },
      rotSpeed: 0.04, complexity: 0.5, sacredForm: 1.5,
    },
  },
  {
    freq: 580,
    state: {
      petals: 12, centralVertices: 6, rings: 4, gateStyle: 0.2,
      color: { r: 50, g: 220, b: 100 }, innerColor: { r: 140, g: 255, b: 160 },
      rotSpeed: 0.035, complexity: 0.65, sacredForm: 2.5,
    },
  },
  {
    freq: 720,
    state: {
      petals: 16, centralVertices: 0, rings: 5, gateStyle: 0.1,
      color: { r: 40, g: 150, b: 255 }, innerColor: { r: 120, g: 200, b: 255 },
      rotSpeed: 0.03, complexity: 0.8, sacredForm: 3.5,
    },
  },
  {
    freq: 870,
    state: {
      petals: 2, centralVertices: 3, rings: 3, gateStyle: 0,
      color: { r: 140, g: 60, b: 255 }, innerColor: { r: 200, g: 150, b: 255 },
      rotSpeed: 0.025, complexity: 0.7, sacredForm: 4.5,
    },
  },
  {
    freq: 1000,
    state: {
      petals: 24, centralVertices: 1, rings: 6, gateStyle: 0,
      color: { r: 200, g: 160, b: 255 }, innerColor: { r: 255, g: 245, b: 255 },
      rotSpeed: 0.015, complexity: 1.0, sacredForm: 5,
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
  private current: ChakraState;
  private target: ChakraState;

  constructor(options: GeometryRendererOptions) {
    this.canvas = options.particleCanvas || options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
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

  private getChakraState(freq: number): ChakraState {
    const clampedFreq = Math.max(20, Math.min(freq, 2000));
    let lower = CHAKRAS[0];
    let upper = CHAKRAS[CHAKRAS.length - 1];
    for (let i = 0; i < CHAKRAS.length - 1; i++) {
      if (clampedFreq >= CHAKRAS[i].freq && clampedFreq <= CHAKRAS[i + 1].freq) {
        lower = CHAKRAS[i];
        upper = CHAKRAS[i + 1];
        break;
      }
    }
    if (clampedFreq <= CHAKRAS[0].freq) return { ...CHAKRAS[0].state };
    if (clampedFreq >= CHAKRAS[CHAKRAS.length - 1].freq) return { ...CHAKRAS[CHAKRAS.length - 1].state };
    const t = (clampedFreq - lower.freq) / (upper.freq - lower.freq);
    const st = t * t * (3 - 2 * t);
    return {
      petals: lower.state.petals + (upper.state.petals - lower.state.petals) * st,
      centralVertices: lower.state.centralVertices + (upper.state.centralVertices - lower.state.centralVertices) * st,
      rings: lower.state.rings + (upper.state.rings - lower.state.rings) * st,
      gateStyle: this.lerp(lower.state.gateStyle, upper.state.gateStyle, st),
      color: this.lerpColor(lower.state.color, upper.state.color, st),
      innerColor: this.lerpColor(lower.state.innerColor, upper.state.innerColor, st),
      rotSpeed: this.lerp(lower.state.rotSpeed, upper.state.rotSpeed, st),
      complexity: this.lerp(lower.state.complexity, upper.state.complexity, st),
      sacredForm: this.lerp(lower.state.sacredForm, upper.state.sacredForm, st),
    };
  }

  private lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
  private lerpColor(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
    return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
  }

  private updateState(dt: number): void {
    const speed = Math.min(dt * 4.0, 0.3);
    this.current.petals += (this.target.petals - this.current.petals) * speed;
    this.current.centralVertices += (this.target.centralVertices - this.current.centralVertices) * speed;
    this.current.rings += (this.target.rings - this.current.rings) * speed;
    this.current.gateStyle += (this.target.gateStyle - this.current.gateStyle) * speed;
    this.current.sacredForm += (this.target.sacredForm - this.current.sacredForm) * speed;
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

  // ========== UTILITY ==========

  private rgba(color: { r: number; g: number; b: number }, alpha: number): string {
    return `rgba(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)},${Math.max(0, Math.min(1, alpha))})`;
  }

  // ========== SACRED GEOMETRY FORMS ==========

  /**
   * Seed of Life: 7 overlapping circles (1 center + 6 around it)
   */
  private drawSeedOfLife(cx: number, cy: number, radius: number, rot: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    const r = radius * 0.35;
    ctx.strokeStyle = this.rgba(color, alpha * 0.8);
    ctx.lineWidth = 1.5;

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // 6 surrounding circles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rot;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Flower of Life: 19 overlapping circles (Seed of Life + 12 outer)
   * blendIn 0-1 controls how many outer circles are visible
   */
  private drawFlowerOfLife(cx: number, cy: number, radius: number, rot: number, blendIn: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    const r = radius * 0.22;
    ctx.lineWidth = 1.2;

    // All circle positions for Flower of Life
    const positions: { x: number; y: number; ring: number }[] = [];

    // Ring 0: center
    positions.push({ x: 0, y: 0, ring: 0 });

    // Ring 1: 6 circles at distance r
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rot;
      positions.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r, ring: 1 });
    }

    // Ring 2: 12 circles at distance r*sqrt(3) and r*2
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rot;
      // Between two ring-1 circles
      const midAngle = angle + Math.PI / 6;
      positions.push({ x: Math.cos(midAngle) * r * Math.sqrt(3), y: Math.sin(midAngle) * r * Math.sqrt(3), ring: 2 });
      // Directly outward from ring-1
      positions.push({ x: Math.cos(angle) * r * 2, y: Math.sin(angle) * r * 2, ring: 2 });
    }

    // Draw circles with fade based on ring and blendIn
    positions.forEach((pos) => {
      let a = alpha * 0.75;
      if (pos.ring === 2) {
        a *= Math.max(0, Math.min(1, blendIn));
      }
      if (a < 0.01) return;
      ctx.strokeStyle = this.rgba(color, a);
      ctx.beginPath();
      ctx.arc(cx + pos.x, cy + pos.y, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Outer bounding circle
    ctx.strokeStyle = this.rgba(color, alpha * 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Sri Yantra: 9 interlocking triangles (4 upward + 5 downward)
   * Creates the classic nested triangle pattern
   */
  private drawSriYantra(cx: number, cy: number, radius: number, rot: number, color: { r: number; g: number; b: number }, innerColor: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    ctx.lineWidth = 1.5;

    // Draw nested triangles at different scales
    // 4 upward-pointing triangles
    const upScales = [0.95, 0.72, 0.5, 0.3];
    const upOffsets = [0, 0.02, 0.05, 0.08]; // slight vertical offsets for authentic look

    for (let i = 0; i < upScales.length; i++) {
      const s = upScales[i] * radius;
      const yOff = upOffsets[i] * radius;
      const a = alpha * (0.9 - i * 0.1);
      ctx.strokeStyle = this.rgba(color, a);
      ctx.beginPath();
      for (let v = 0; v < 3; v++) {
        const angle = (v / 3) * Math.PI * 2 - Math.PI / 2 + rot;
        const x = cx + Math.cos(angle) * s;
        const y = cy + Math.sin(angle) * s + yOff;
        if (v === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 5 downward-pointing triangles (inverted)
    const downScales = [0.88, 0.65, 0.45, 0.28, 0.15];
    const downOffsets = [-0.02, -0.04, -0.06, -0.07, -0.05];

    for (let i = 0; i < downScales.length; i++) {
      const s = downScales[i] * radius;
      const yOff = downOffsets[i] * radius;
      const a = alpha * (0.85 - i * 0.08);
      ctx.strokeStyle = this.rgba(innerColor, a);
      ctx.beginPath();
      for (let v = 0; v < 3; v++) {
        const angle = (v / 3) * Math.PI * 2 + Math.PI / 2 + rot; // inverted
        const x = cx + Math.cos(angle) * s;
        const y = cy + Math.sin(angle) * s + yOff;
        if (v === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Inner bindu circle
    ctx.strokeStyle = this.rgba(innerColor, alpha * 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.08, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Metatron's Cube: 13 circles connected by lines
   * Creates the classic 3D-illusion sacred geometry pattern
   */
  private drawMetatronsCube(cx: number, cy: number, radius: number, rot: number, color: { r: number; g: number; b: number }, innerColor: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    const nodeR = radius * 0.06;

    // 13 node positions: 1 center + 6 inner ring + 6 outer ring
    const nodes: { x: number; y: number }[] = [];
    nodes.push({ x: cx, y: cy }); // center

    const innerR = radius * 0.42;
    const outerR = radius * 0.84;

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rot;
      nodes.push({ x: cx + Math.cos(angle) * innerR, y: cy + Math.sin(angle) * innerR });
    }
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rot + Math.PI / 6;
      nodes.push({ x: cx + Math.cos(angle) * outerR, y: cy + Math.sin(angle) * outerR });
    }

    // Draw connecting lines (every node to every other — the full Metatron's Cube)
    ctx.strokeStyle = this.rgba(color, alpha * 0.2);
    ctx.lineWidth = 0.7;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }

    // Draw node circles
    nodes.forEach((node, i) => {
      const c = i === 0 ? innerColor : color;
      const a = i === 0 ? alpha * 0.9 : alpha * 0.7;

      // Circle outline
      ctx.strokeStyle = this.rgba(c, a);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeR, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle fill
      ctx.fillStyle = this.rgba(c, a * 0.15);
      ctx.fill();
    });
  }

  /**
   * Merkaba: 2D projection of star tetrahedron (two interlocking triangles with depth lines)
   */
  private drawMerkaba(cx: number, cy: number, radius: number, rot: number, color: { r: number; g: number; b: number }, innerColor: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;

    // Outer triangle (upward)
    const drawTriangle = (scale: number, invert: boolean, c: { r: number; g: number; b: number }, a: number) => {
      const s = scale * radius;
      ctx.strokeStyle = this.rgba(c, a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let v = 0; v < 3; v++) {
        const baseAngle = invert ? Math.PI / 2 : -Math.PI / 2;
        const angle = (v / 3) * Math.PI * 2 + baseAngle + rot;
        const x = cx + Math.cos(angle) * s;
        const y = cy + Math.sin(angle) * s;
        if (v === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    };

    // Large star (two interlocking triangles)
    drawTriangle(0.9, false, color, alpha * 0.85);
    drawTriangle(0.9, true, innerColor, alpha * 0.85);

    // Inner star (smaller, offset rotation for 3D effect)
    drawTriangle(0.55, false, color, alpha * 0.5);
    drawTriangle(0.55, true, innerColor, alpha * 0.5);

    // Depth lines connecting vertices of inner to outer
    ctx.strokeStyle = this.rgba(color, alpha * 0.25);
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2 + rot;
      const innerS = radius * 0.55;
      const outerS = radius * 0.9;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerS, cy + Math.sin(angle) * innerS);
      ctx.lineTo(cx + Math.cos(angle + Math.PI / 6) * outerS, cy + Math.sin(angle + Math.PI / 6) * outerS);
      ctx.stroke();
    }

    // Central hexagon
    ctx.strokeStyle = this.rgba(innerColor, alpha * 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rot;
      const x = cx + Math.cos(angle) * radius * 0.32;
      const y = cy + Math.sin(angle) * radius * 0.32;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * Golden Spiral mandala with layered rings
   */
  private drawGoldenMandala(cx: number, cy: number, radius: number, rot: number, color: { r: number; g: number; b: number }, innerColor: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    const PHI = 1.618033988749;

    // Golden spiral
    ctx.strokeStyle = this.rgba(innerColor, alpha * 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const spiralSteps = 300;
    for (let i = 0; i < spiralSteps; i++) {
      const t = i / spiralSteps;
      const angle = t * Math.PI * 6 + rot;
      const r = radius * 0.05 * Math.pow(PHI, t * 3);
      if (r > radius * 0.9) break;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Concentric golden-ratio rings
    ctx.lineWidth = 1;
    let ringR = radius * 0.1;
    for (let i = 0; i < 7 && ringR < radius; i++) {
      ctx.strokeStyle = this.rgba(color, alpha * (0.3 + i * 0.05));
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ringR *= PHI * 0.6;
    }

    // Radiating lines at golden angle intervals
    const goldenAngle = Math.PI * 2 / (PHI * PHI);
    ctx.strokeStyle = this.rgba(color, alpha * 0.15);
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 24; i++) {
      const angle = i * goldenAngle + rot;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * radius * 0.08, cy + Math.sin(angle) * radius * 0.08);
      ctx.lineTo(cx + Math.cos(angle) * radius * 0.88, cy + Math.sin(angle) * radius * 0.88);
      ctx.stroke();
    }
  }

  // ========== YANTRA ELEMENTS ==========

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
      const width = petalLength * 0.3;

      // Pointed petal shape (more like reference yantras)
      const cp1x = baseX + Math.cos(angle) * petalLength * 0.4 + Math.cos(perpAngle) * width;
      const cp1y = baseY + Math.sin(angle) * petalLength * 0.4 + Math.sin(perpAngle) * width;
      const cp2x = baseX + Math.cos(angle) * petalLength * 0.4 - Math.cos(perpAngle) * width;
      const cp2y = baseY + Math.sin(angle) * petalLength * 0.4 - Math.sin(perpAngle) * width;

      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
      ctx.quadraticCurveTo(cp2x, cp2y, baseX, baseY);
      ctx.closePath();

      ctx.fillStyle = this.rgba(color, alpha * 0.12);
      ctx.fill();
      ctx.strokeStyle = this.rgba(color, alpha * 0.85);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  private drawBhupura(cx: number, cy: number, radius: number, gateStyle: number, rotation: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    if (gateStyle < 0.05) {
      ctx.strokeStyle = this.rgba(color, alpha * 0.4);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    // Nested square bhupura (3 concentric squares like real yantras)
    const layers = gateStyle > 0.5 ? 3 : gateStyle > 0.2 ? 2 : 1;
    for (let layer = 0; layer < layers; layer++) {
      const layerR = radius * (1 - layer * 0.06);
      const a = alpha * (0.5 - layer * 0.1);
      ctx.strokeStyle = this.rgba(color, a);
      ctx.lineWidth = 2 - layer * 0.5;

      ctx.beginPath();
      const steps = 360;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2 + rotation;
        const circR = layerR;
        const absC = Math.abs(Math.cos(angle - rotation));
        const absS = Math.abs(Math.sin(angle - rotation));
        const sqR = layerR / Math.max(absC, absS);
        const clampedSqR = Math.min(sqR, layerR * 1.42);
        const r = this.lerp(circR, clampedSqR, gateStyle);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // T-shaped gates on cardinal directions
    if (gateStyle > 0.4) {
      const gateAlpha = (gateStyle - 0.4) / 0.6;
      ctx.strokeStyle = this.rgba(color, alpha * 0.4 * gateAlpha);
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 4; g++) {
        const gAngle = (g / 4) * Math.PI * 2 + rotation;
        const gateW = radius * 0.1;
        const gateD = radius * 0.12 * gateStyle;
        const perpA = gAngle + Math.PI / 2;
        const outerR = radius * 1.15;
        const gx = cx + Math.cos(gAngle) * outerR;
        const gy = cy + Math.sin(gAngle) * outerR;

        // T-gate shape
        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(perpA) * gateW, gy + Math.sin(perpA) * gateW);
        ctx.lineTo(gx + Math.cos(gAngle) * gateD + Math.cos(perpA) * gateW * 0.5,
                   gy + Math.sin(gAngle) * gateD + Math.sin(perpA) * gateW * 0.5);
        ctx.lineTo(gx + Math.cos(gAngle) * gateD - Math.cos(perpA) * gateW * 0.5,
                   gy + Math.sin(gAngle) * gateD - Math.sin(perpA) * gateW * 0.5);
        ctx.lineTo(gx - Math.cos(perpA) * gateW, gy - Math.sin(perpA) * gateW);
        ctx.stroke();
      }
    }
  }

  private drawBindu(cx: number, cy: number, radius: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    const glowR = radius * 5;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    gradient.addColorStop(0, this.rgba(color, alpha * 0.8));
    gradient.addColorStop(0.2, this.rgba(color, alpha * 0.3));
    gradient.addColorStop(1, this.rgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.rgba({ r: 255, g: 250, b: 240 }, alpha * 0.9);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ========== MAIN RENDER ==========

  render(timestamp: number): void {
    const dt = this.time ? (timestamp * 0.001 - this.time) : 0.016;
    this.time = timestamp * 0.001;
    this.updateState(Math.min(dt, 0.05));

    const ctx = this.ctx;
    const s = this.current;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxR = Math.min(this.width, this.height) * 0.44;

    const breathe = Math.sin(this.time * 0.8) * 0.02 + 1.0;
    const breathe2 = Math.sin(this.time * 0.5 + 1.0) * 0.015 + 1.0;
    const rot1 = this.time * s.rotSpeed;
    const rot2 = -this.time * s.rotSpeed * 0.7;
    const rot3 = this.time * s.rotSpeed * 0.4;
    const alpha = 0.65 + this.amplitude * 0.35;

    const dimColor = {
      r: s.color.r * 0.6, g: s.color.g * 0.6, b: s.color.b * 0.6,
    };

    const petals = Math.max(2, Math.round(s.petals));
    const rings = Math.max(1, Math.round(s.rings));

    // === LAYER 1: Bhupura (outer enclosure) ===
    this.drawBhupura(cx, cy, maxR * breathe, s.gateStyle, rot3 * 0.3, dimColor, alpha);

    // === LAYER 2: Outer petal ring ===
    this.drawPetalRing(cx, cy, maxR * 0.7 * breathe, maxR * 0.2, petals, rot1, s.color, alpha * 0.7);

    // === LAYER 3: Sacred Geometry Form (the main event) ===
    const sacredR = maxR * 0.6 * breathe2;
    const form = s.sacredForm;

    if (form < 1) {
      // Seed of Life → Flower of Life blend
      const seedAlpha = Math.max(0, 1 - form);
      const flowerAlpha = Math.min(1, form);
      if (seedAlpha > 0.01) {
        this.drawSeedOfLife(cx, cy, sacredR, rot1 * 0.5, s.innerColor, alpha * seedAlpha);
      }
      if (flowerAlpha > 0.01) {
        this.drawFlowerOfLife(cx, cy, sacredR, rot1 * 0.5, flowerAlpha * 0.3, s.innerColor, alpha * flowerAlpha);
      }
    } else if (form < 2) {
      // Flower of Life → Sri Yantra blend
      const flowerAlpha = Math.max(0, 2 - form);
      const yantraAlpha = Math.min(1, form - 1);
      if (flowerAlpha > 0.01) {
        this.drawFlowerOfLife(cx, cy, sacredR, rot1 * 0.5, 1, s.innerColor, alpha * flowerAlpha * 0.8);
      }
      if (yantraAlpha > 0.01) {
        this.drawSriYantra(cx, cy, sacredR * 0.8, rot1 * 0.2, s.color, s.innerColor, alpha * yantraAlpha);
      }
    } else if (form < 3) {
      // Sri Yantra → Metatron's Cube blend
      const yantraAlpha = Math.max(0, 3 - form);
      const metatronAlpha = Math.min(1, form - 2);
      if (yantraAlpha > 0.01) {
        this.drawSriYantra(cx, cy, sacredR * 0.8, rot1 * 0.2, s.color, s.innerColor, alpha * yantraAlpha);
      }
      if (metatronAlpha > 0.01) {
        this.drawMetatronsCube(cx, cy, sacredR, rot1 * 0.3, s.color, s.innerColor, alpha * metatronAlpha);
      }
    } else if (form < 4) {
      // Metatron's Cube → Merkaba blend
      const metatronAlpha = Math.max(0, 4 - form);
      const merkabaAlpha = Math.min(1, form - 3);
      if (metatronAlpha > 0.01) {
        this.drawMetatronsCube(cx, cy, sacredR, rot1 * 0.3, s.color, s.innerColor, alpha * metatronAlpha);
      }
      if (merkabaAlpha > 0.01) {
        this.drawMerkaba(cx, cy, sacredR * 0.85, rot1 * 0.15, s.color, s.innerColor, alpha * merkabaAlpha);
      }
    } else {
      // Merkaba → Golden Mandala blend
      const merkabaAlpha = Math.max(0, 5 - form);
      const mandalaAlpha = Math.min(1, form - 4);
      if (merkabaAlpha > 0.01) {
        this.drawMerkaba(cx, cy, sacredR * 0.85, rot1 * 0.15, s.color, s.innerColor, alpha * merkabaAlpha);
      }
      if (mandalaAlpha > 0.01) {
        this.drawGoldenMandala(cx, cy, sacredR, rot1, s.color, s.innerColor, alpha * mandalaAlpha);
      }
    }

    // === LAYER 4: Inner petal ring ===
    const innerPetals = Math.max(2, Math.round(petals * 0.6));
    this.drawPetalRing(cx, cy, maxR * 0.28 * breathe, maxR * 0.14, innerPetals, rot2, s.innerColor, alpha * 0.6);

    // === LAYER 5: Concentric rings ===
    for (let i = 1; i <= rings; i++) {
      const t = i / (rings + 1);
      const ringR = maxR * 0.65 * t * breathe2;
      ctx.strokeStyle = this.rgba(dimColor, alpha * (0.15 + t * 0.2));
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // === LAYER 6: Central bindu ===
    this.drawBindu(cx, cy, maxR * 0.025 * breathe, s.innerColor, alpha);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  destroy(): void {}
}
