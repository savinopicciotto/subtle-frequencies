/**
 * Sacred Geometry / Yantra Renderer
 *
 * Unified organic progression following the Flower of Life construction:
 * Each chakra level BUILDS on the previous — cellular division, not crossfading.
 *
 * Root (0):     Single circle — the seed, unity
 * Sacral (1):   Vesica Piscis — duality, first division
 * Solar (2.5):  Seed of Life forming — circles multiply
 * Heart (3.5):  Seed of Life + hexagram emerges from intersections
 * Throat (4.5): Flower of Life — second ring of circles grows outward
 * Third Eye (5.5): Metatron's Cube — connecting lines reveal hidden structure
 * Crown (6):    Full mandala — golden spiral unifies everything
 */

interface GeometryRendererOptions {
  canvas: HTMLCanvasElement;
  particleCanvas?: HTMLCanvasElement;
}

interface ChakraState {
  petals: number;
  gateStyle: number;
  color: { r: number; g: number; b: number };
  innerColor: { r: number; g: number; b: number };
  rotSpeed: number;
  form: number; // 0-6 progressive growth
}

const CHAKRAS: { freq: number; state: ChakraState }[] = [
  { freq: 120, state: {
    petals: 4, gateStyle: 1,
    color: { r: 220, g: 50, b: 30 }, innerColor: { r: 240, g: 180, b: 50 },
    rotSpeed: 0.02, form: 0,
  }},
  { freq: 300, state: {
    petals: 6, gateStyle: 0.7,
    color: { r: 240, g: 140, b: 30 }, innerColor: { r: 255, g: 200, b: 60 },
    rotSpeed: 0.025, form: 1,
  }},
  { freq: 450, state: {
    petals: 10, gateStyle: 0.4,
    color: { r: 250, g: 210, b: 30 }, innerColor: { r: 255, g: 240, b: 100 },
    rotSpeed: 0.03, form: 2.5,
  }},
  { freq: 580, state: {
    petals: 12, gateStyle: 0.2,
    color: { r: 50, g: 220, b: 100 }, innerColor: { r: 140, g: 255, b: 160 },
    rotSpeed: 0.03, form: 3.5,
  }},
  { freq: 720, state: {
    petals: 16, gateStyle: 0.1,
    color: { r: 40, g: 150, b: 255 }, innerColor: { r: 120, g: 200, b: 255 },
    rotSpeed: 0.025, form: 4.5,
  }},
  { freq: 870, state: {
    petals: 2, gateStyle: 0,
    color: { r: 140, g: 60, b: 255 }, innerColor: { r: 200, g: 150, b: 255 },
    rotSpeed: 0.02, form: 5.5,
  }},
  { freq: 1000, state: {
    petals: 24, gateStyle: 0,
    color: { r: 200, g: 160, b: 255 }, innerColor: { r: 255, g: 245, b: 255 },
    rotSpeed: 0.015, form: 6,
  }},
];

// Precomputed circle positions for the Flower of Life
// Each has a birth threshold — the form value at which it appears
interface SacredCircle {
  dx: number; // offset from center (in units of circle radius)
  dy: number;
  birth: number;
}

// Build the Flower of Life circle positions
// SYMMETRY CONSTRAINT: entire rings appear simultaneously to maintain rotational symmetry
function buildCircleOrder(): SacredCircle[] {
  const circles: SacredCircle[] = [];

  // Ring 0: Center circle (the seed)
  circles.push({ dx: 0, dy: 0, birth: 0 });

  // Ring 1: All 6 circles appear together → Seed of Life (always 6-fold symmetric)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    circles.push({ dx: Math.cos(angle), dy: Math.sin(angle), birth: 1.0 });
  }

  // Ring 2: All 12 circles appear together → Flower of Life (always symmetric)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    circles.push({ dx: Math.cos(angle) * 2, dy: Math.sin(angle) * 2, birth: 3.5 });
    const midAngle = angle + Math.PI / 6;
    circles.push({ dx: Math.cos(midAngle) * Math.sqrt(3), dy: Math.sin(midAngle) * Math.sqrt(3), birth: 3.5 });
  }

  return circles;
}

const SACRED_CIRCLES = buildCircleOrder();

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

  setAmplitude(amplitude: number): void { this.amplitude = amplitude; }
  setHarmonicRatios(ratios: number[]): void { this.harmonicRatios = ratios; }

  private getChakraState(freq: number): ChakraState {
    const f = Math.max(20, Math.min(freq, 2000));
    if (f <= CHAKRAS[0].freq) return { ...CHAKRAS[0].state };
    if (f >= CHAKRAS[CHAKRAS.length - 1].freq) return { ...CHAKRAS[CHAKRAS.length - 1].state };
    let lo = CHAKRAS[0], hi = CHAKRAS[CHAKRAS.length - 1];
    for (let i = 0; i < CHAKRAS.length - 1; i++) {
      if (f >= CHAKRAS[i].freq && f <= CHAKRAS[i + 1].freq) { lo = CHAKRAS[i]; hi = CHAKRAS[i + 1]; break; }
    }
    const t = (f - lo.freq) / (hi.freq - lo.freq);
    const st = t * t * (3 - 2 * t);
    const lerp = (a: number, b: number) => a + (b - a) * st;
    const lc = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) =>
      ({ r: a.r + (b.r - a.r) * st, g: a.g + (b.g - a.g) * st, b: a.b + (b.b - a.b) * st });
    return {
      petals: lerp(lo.state.petals, hi.state.petals),
      gateStyle: lerp(lo.state.gateStyle, hi.state.gateStyle),
      color: lc(lo.state.color, hi.state.color),
      innerColor: lc(lo.state.innerColor, hi.state.innerColor),
      rotSpeed: lerp(lo.state.rotSpeed, hi.state.rotSpeed),
      form: lerp(lo.state.form, hi.state.form),
    };
  }

  private updateState(dt: number): void {
    const sp = Math.min(dt * 4.0, 0.3);
    const c = this.current, t = this.target;
    c.petals += (t.petals - c.petals) * sp;
    c.gateStyle += (t.gateStyle - c.gateStyle) * sp;
    c.form += (t.form - c.form) * sp;
    c.rotSpeed += (t.rotSpeed - c.rotSpeed) * sp;
    c.color = { r: c.color.r + (t.color.r - c.color.r) * sp, g: c.color.g + (t.color.g - c.color.g) * sp, b: c.color.b + (t.color.b - c.color.b) * sp };
    c.innerColor = { r: c.innerColor.r + (t.innerColor.r - c.innerColor.r) * sp, g: c.innerColor.g + (t.innerColor.g - c.innerColor.g) * sp, b: c.innerColor.b + (t.innerColor.b - c.innerColor.b) * sp };
  }

  private rgba(c: { r: number; g: number; b: number }, a: number): string {
    return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${Math.max(0, Math.min(1, a))})`;
  }

  // ========== UNIFIED SACRED PROGRESSION ==========

  /**
   * Draw the progressive sacred geometry — one system that grows
   * from a single circle to the full Flower of Life / Metatron's Cube
   */
  private drawSacredProgression(
    cx: number, cy: number, radius: number,
    form: number, rot: number, breathe: number,
    color: { r: number; g: number; b: number },
    innerColor: { r: number; g: number; b: number },
    alpha: number
  ): void {
    const ctx = this.ctx;
    const circleR = radius * 0.25; // radius of each individual circle

    // === PHASE 1: Circles appear progressively (form 0 → 4.5) ===
    // Each circle grows in from its birth point
    const circlePositions: { x: number; y: number; age: number }[] = [];

    for (const sc of SACRED_CIRCLES) {
      if (form < sc.birth) continue;
      const age = Math.min(1, (form - sc.birth) * 4.0); // fast grow-in to avoid wonky mid-growth
      const r = circleR * age * breathe;
      const x = cx + sc.dx * circleR * breathe;
      const y = cy + sc.dy * circleR * breathe;

      circlePositions.push({ x, y, age });

      // Draw circle with age-based alpha
      ctx.strokeStyle = this.rgba(innerColor, alpha * 0.7 * age);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // === PHASE 2: Triangles emerge from Seed of Life intersections (form 2+) ===
    // Connecting alternating ring-1 circle centers reveals the hidden hexagram
    if (form > 1.8) {
      const triAlpha = Math.min(1, (form - 1.8) * 1.5);

      // Upward triangle: ring-1 circles at indices 0, 2, 4 (every other)
      ctx.lineWidth = 1.5;
      for (let pass = 0; pass < 2; pass++) {
        const startIdx = pass; // 0 = upward, 1 = downward
        const c = pass === 0 ? color : innerColor;
        const a = alpha * triAlpha * (pass === 0 ? 0.7 : 0.55);
        const verts: { x: number; y: number }[] = [];
        for (let i = startIdx; i < 6; i += 2) {
          const ci = circlePositions[1 + i]; // ring-1 circles are indices 1-6
          if (ci) verts.push({ x: ci.x, y: ci.y });
        }
        if (verts.length === 3) {
          ctx.strokeStyle = this.rgba(c, a);
          ctx.beginPath();
          ctx.moveTo(verts[0].x, verts[0].y);
          ctx.lineTo(verts[1].x, verts[1].y);
          ctx.lineTo(verts[2].x, verts[2].y);
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Nested triangles at smaller scales (form 2.5+)
      if (form > 2.5) {
        const nestAlpha = Math.min(1, (form - 2.5) * 1.2);
        const scales = [0.55, 0.3];
        for (const scale of scales) {
          for (let pass = 0; pass < 2; pass++) {
            const c = pass === 0 ? color : innerColor;
            const a = alpha * nestAlpha * 0.4;
            ctx.strokeStyle = this.rgba(c, a);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let v = 0; v < 3; v++) {
              const baseAngle = pass === 0 ? -Math.PI / 2 : Math.PI / 2;
              const angle = (v / 3) * Math.PI * 2 + baseAngle + rot * 0.3;
              const x = cx + Math.cos(angle) * circleR * scale * breathe;
              const y = cy + Math.sin(angle) * circleR * scale * breathe;
              if (v === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    }

    // === PHASE 3: Hexagram emerges (form 2.2+) ===
    // The Star of David is already hidden in the Seed of Life — we just reveal it
    if (form > 2.2 && circlePositions.length >= 7) {
      const hexAlpha = Math.min(1, (form - 2.2) * 1.2);
      // Hexagon connecting all ring-1 centers
      ctx.strokeStyle = this.rgba(color, alpha * hexAlpha * 0.3);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ci = circlePositions[1 + i];
        if (!ci) continue;
        if (i === 0) ctx.moveTo(ci.x, ci.y); else ctx.lineTo(ci.x, ci.y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // === PHASE 5: Metatron's Cube connecting lines (form 4.5+) ===
    // Lines connecting all circle centers — reveals the hidden structure
    if (form > 4.5 && circlePositions.length > 7) {
      const lineAlpha = Math.min(1, (form - 4.5) * 1.0);
      ctx.strokeStyle = this.rgba(color, alpha * lineAlpha * 0.15);
      ctx.lineWidth = 0.6;

      // Connect every circle center to every other
      for (let i = 0; i < circlePositions.length; i++) {
        for (let j = i + 1; j < circlePositions.length; j++) {
          ctx.beginPath();
          ctx.moveTo(circlePositions[i].x, circlePositions[i].y);
          ctx.lineTo(circlePositions[j].x, circlePositions[j].y);
          ctx.stroke();
        }
      }

      // Highlight the circle centers as nodes
      if (lineAlpha > 0.3) {
        const nodeAlpha = (lineAlpha - 0.3) / 0.7;
        for (const pos of circlePositions) {
          ctx.fillStyle = this.rgba(innerColor, alpha * nodeAlpha * 0.4 * pos.age);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, circleR * 0.06, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // === PHASE 6: Golden spiral emerges (form 5.5+) ===
    if (form > 5.5) {
      const spiralAlpha = Math.min(1, (form - 5.5) * 2);
      const PHI = 1.618033988749;
      ctx.strokeStyle = this.rgba(innerColor, alpha * spiralAlpha * 0.4);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 300; i++) {
        const t = i / 300;
        const angle = t * Math.PI * 6 + rot;
        const r = radius * 0.04 * Math.pow(PHI, t * 3);
        if (r > radius * 0.9) break;
        const x = cx + Math.cos(angle) * r * breathe;
        const y = cy + Math.sin(angle) * r * breathe;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Outer bounding circle (always present, strength grows with form)
    const boundAlpha = Math.min(1, form * 0.3);
    if (boundAlpha > 0.01) {
      ctx.strokeStyle = this.rgba(color, alpha * boundAlpha * 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.85 * breathe, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // ========== YANTRA FRAME ELEMENTS ==========

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
      const cp1x = baseX + Math.cos(angle) * petalLength * 0.4 + Math.cos(perpAngle) * width;
      const cp1y = baseY + Math.sin(angle) * petalLength * 0.4 + Math.sin(perpAngle) * width;
      const cp2x = baseX + Math.cos(angle) * petalLength * 0.4 - Math.cos(perpAngle) * width;
      const cp2y = baseY + Math.sin(angle) * petalLength * 0.4 - Math.sin(perpAngle) * width;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
      ctx.quadraticCurveTo(cp2x, cp2y, baseX, baseY);
      ctx.closePath();
      ctx.fillStyle = this.rgba(color, alpha * 0.1);
      ctx.fill();
      ctx.strokeStyle = this.rgba(color, alpha * 0.8);
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
    // Nested square bhupura
    const layers = gateStyle > 0.5 ? 3 : gateStyle > 0.2 ? 2 : 1;
    for (let layer = 0; layer < layers; layer++) {
      const layerR = radius * (1 - layer * 0.06);
      ctx.strokeStyle = this.rgba(color, alpha * (0.45 - layer * 0.1));
      ctx.lineWidth = 2 - layer * 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 360; i++) {
        const angle = (i / 360) * Math.PI * 2 + rotation;
        const circR = layerR;
        const absC = Math.abs(Math.cos(angle - rotation));
        const absS = Math.abs(Math.sin(angle - rotation));
        const sqR = Math.min(layerR / Math.max(absC, absS), layerR * 1.42);
        const r = circR + (sqR - circR) * gateStyle;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    // T-gates
    if (gateStyle > 0.4) {
      const ga = (gateStyle - 0.4) / 0.6;
      ctx.strokeStyle = this.rgba(color, alpha * 0.35 * ga);
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 4; g++) {
        const gA = (g / 4) * Math.PI * 2 + rotation;
        const w = radius * 0.1, d = radius * 0.12 * gateStyle;
        const pA = gA + Math.PI / 2;
        const ox = cx + Math.cos(gA) * radius * 1.15;
        const oy = cy + Math.sin(gA) * radius * 1.15;
        ctx.beginPath();
        ctx.moveTo(ox + Math.cos(pA) * w, oy + Math.sin(pA) * w);
        ctx.lineTo(ox + Math.cos(gA) * d + Math.cos(pA) * w * 0.5, oy + Math.sin(gA) * d + Math.sin(pA) * w * 0.5);
        ctx.lineTo(ox + Math.cos(gA) * d - Math.cos(pA) * w * 0.5, oy + Math.sin(gA) * d - Math.sin(pA) * w * 0.5);
        ctx.lineTo(ox - Math.cos(pA) * w, oy - Math.sin(pA) * w);
        ctx.stroke();
      }
    }
  }

  private drawBindu(cx: number, cy: number, radius: number, color: { r: number; g: number; b: number }, alpha: number): void {
    const ctx = this.ctx;
    const glowR = radius * 5;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    grad.addColorStop(0, this.rgba(color, alpha * 0.8));
    grad.addColorStop(0.2, this.rgba(color, alpha * 0.3));
    grad.addColorStop(1, this.rgba(color, 0));
    ctx.fillStyle = grad;
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
    const rot1 = this.time * s.rotSpeed;
    const rot2 = -this.time * s.rotSpeed * 0.7;
    const rot3 = this.time * s.rotSpeed * 0.4;
    const alpha = 0.65 + this.amplitude * 0.35;

    const dimColor = { r: s.color.r * 0.6, g: s.color.g * 0.6, b: s.color.b * 0.6 };
    const petals = Math.max(2, Math.round(s.petals));

    // === LAYER 1: Bhupura (outer frame) ===
    this.drawBhupura(cx, cy, maxR * breathe, s.gateStyle, rot3 * 0.3, dimColor, alpha);

    // === LAYER 2: Outer petal ring ===
    this.drawPetalRing(cx, cy, maxR * 0.7 * breathe, maxR * 0.2, petals, rot1, s.color, alpha * 0.7);

    // === LAYER 3: Sacred geometry progression (the main event) ===
    this.drawSacredProgression(
      cx, cy, maxR * 0.65,
      s.form, rot1 * 0.3, breathe,
      s.color, s.innerColor, alpha
    );

    // === LAYER 4: Inner petal ring ===
    const innerPetals = Math.max(2, Math.round(petals * 0.6));
    this.drawPetalRing(cx, cy, maxR * 0.28 * breathe, maxR * 0.13, innerPetals, rot2, s.innerColor, alpha * 0.55);

    // === LAYER 5: Central bindu ===
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
