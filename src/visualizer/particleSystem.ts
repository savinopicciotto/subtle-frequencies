/**
 * Particle system for cymatic visualization
 * Simulates sand grains settling on nodal lines of Chladni patterns
 */

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  brightness: number;
  noiseOffset: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private particleCount: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, particleCount: number = 2000) {
    this.canvas = canvas;
    this.particleCount = particleCount;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.initializeParticles();
  }

  private initializeParticles(): void {
    this.particles = [];
    const width = this.canvas.width;
    const height = this.canvas.height;

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        targetX: Math.random() * width,
        targetY: Math.random() * height,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        noiseOffset: Math.random() * 1000,
      });
    }
  }

  /**
   * Update particle targets based on Chladni pattern
   */
  updateTargets(modeN: number, modeM: number): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;

    this.particles.forEach((particle) => {
      // Find nearest nodal line with better sampling
      let minDistance = Infinity;
      let bestX = particle.targetX;
      let bestY = particle.targetY;

      // Sample multiple points to find nodal line
      for (let attempts = 0; attempts < 20; attempts++) {
        // Sample within circular bounds
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius * 0.85; // Stay within 85% of radius
        const testX = centerX + Math.cos(angle) * r;
        const testY = centerY + Math.sin(angle) * r;

        // Convert to normalized coordinates (-1 to 1)
        const normX = (testX - centerX) / (width / 2);
        const normY = (testY - centerY) / (height / 2);

        // Calculate Chladni value
        const chladniValue = this.calculateChladni(normX, normY, modeN, modeM);

        // Check if close to nodal line (zero crossing)
        const distance = Math.abs(chladniValue);

        if (distance < minDistance) {
          minDistance = distance;
          bestX = testX;
          bestY = testY;
        }
      }

      // Only update if we found a good nodal line position
      if (minDistance < 0.2) {
        particle.targetX = bestX;
        particle.targetY = bestY;
      }
    });
  }

  /**
   * Calculate Chladni pattern value at a point
   */
  private calculateChladni(x: number, y: number, n: number, m: number): number {
    const PI = Math.PI;
    return (
      Math.cos(n * PI * x) * Math.cos(m * PI * y) -
      Math.cos(m * PI * x) * Math.cos(n * PI * y)
    );
  }

  /**
   * Update particle physics with smooth lerp to targets
   */
  update(deltaTime: number, amplitude: number, time: number): void {
    const lerpSpeed = 2.0 * deltaTime; // Smooth transition speed

    this.particles.forEach((particle) => {
      // Calculate direction to target
      const dx = particle.targetX - particle.x;
      const dy = particle.targetY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Apply force toward target
      if (distance > 0.1) {
        const force = Math.min(distance * 0.05, 1.0);
        particle.vx += (dx / distance) * force * lerpSpeed;
        particle.vy += (dy / distance) * force * lerpSpeed;
      }

      // Add subtle perlin-like noise for organic movement
      const noiseX = Math.sin(time * 0.3 + particle.noiseOffset) * 0.5;
      const noiseY = Math.cos(time * 0.3 + particle.noiseOffset * 1.3) * 0.5;

      particle.vx += noiseX * deltaTime * 10;
      particle.vy += noiseY * deltaTime * 10;

      // Apply damping
      particle.vx *= 0.95;
      particle.vy *= 0.95;

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Keep particles in bounds
      const margin = 10;
      if (particle.x < -margin) particle.x = this.canvas.width + margin;
      if (particle.x > this.canvas.width + margin) particle.x = -margin;
      if (particle.y < -margin) particle.y = this.canvas.height + margin;
      if (particle.y > this.canvas.height + margin) particle.y = -margin;

      // Modulate brightness with amplitude
      particle.brightness = 0.5 + amplitude * 0.5;
    });
  }

  /**
   * Render particles to canvas
   */
  render(color: { r: number; g: number; b: number }, amplitude: number): void {
    const ctx = this.ctx;

    // Clear canvas with transparency
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle) => {
      const alpha = particle.brightness * (0.3 + amplitude * 0.3);

      // Draw particle (no extra glow - keep it subtle)
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Adjust particle count for performance
   */
  setParticleCount(count: number): void {
    this.particleCount = count;
    this.initializeParticles();
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    // Reinitialize particles for new canvas size
    this.initializeParticles();
  }
}
