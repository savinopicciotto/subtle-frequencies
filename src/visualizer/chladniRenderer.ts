/**
 * Chladni pattern renderer using WebGL
 * Renders cymatic patterns based on frequency with particle overlay
 */

import { ParticleSystem } from './particleSystem';
import vertexShaderSource from './shaders/chladni.vert.glsl?raw';
import fragmentShaderSource from './shaders/chladni.frag.glsl?raw';

interface ChladniRendererOptions {
  canvas: HTMLCanvasElement;
  particleCanvas: HTMLCanvasElement;
  useWebGL?: boolean;
  particleCount?: number;
}

export class ChladniRenderer {
  private canvas: HTMLCanvasElement;
  private particleCanvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private particleSystem: ParticleSystem;

  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;

  // Uniforms
  private u_modeN: WebGLUniformLocation | null = null;
  private u_modeM: WebGLUniformLocation | null = null;
  private u_time: WebGLUniformLocation | null = null;
  private u_amplitude: WebGLUniformLocation | null = null;
  private u_color: WebGLUniformLocation | null = null;

  // Current state
  private currentModeN = 3;
  private currentModeM = 2;
  private targetModeN = 3;
  private targetModeM = 2;
  private time = 0;
  private amplitude = 0.5;
  private lastFrameTime = 0;

  constructor(options: ChladniRendererOptions) {
    this.canvas = options.canvas;
    this.particleCanvas = options.particleCanvas;

    // Initialize WebGL or fallback to 2D
    if (options.useWebGL !== false) {
      this.gl = (this.canvas.getContext('webgl') as WebGLRenderingContext) ||
                (this.canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    }

    if (!this.gl) {
      console.warn('WebGL not available, falling back to 2D canvas');
      this.ctx2d = this.canvas.getContext('2d');
    }

    // Initialize particle system
    this.particleSystem = new ParticleSystem(
      this.particleCanvas,
      options.particleCount || 5000
    );

    // Setup renderer
    if (this.gl) {
      this.setupWebGL();
    }
  }

  /**
   * Setup WebGL shaders and buffers
   */
  private setupWebGL(): void {
    const gl = this.gl;
    if (!gl) return;

    // Create shaders
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return;
    }

    // Create program
    this.program = this.createProgram(gl, vertexShader, fragmentShader);
    if (!this.program) {
      console.error('Failed to create program');
      return;
    }

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    this.u_modeN = gl.getUniformLocation(this.program, 'u_modeN');
    this.u_modeM = gl.getUniformLocation(this.program, 'u_modeM');
    this.u_time = gl.getUniformLocation(this.program, 'u_time');
    this.u_amplitude = gl.getUniformLocation(this.program, 'u_amplitude');
    this.u_color = gl.getUniformLocation(this.program, 'u_color');

    // Create position buffer (full-screen quad)
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Setup attribute
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Create and compile shader
   */
  private createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Create and link program
   */
  private createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  /**
   * Update frequency and calculate mode numbers
   * Physically accurate: octave frequencies produce same pattern at higher resolution
   */
  updateFrequency(frequency: number): void {
    // Physically accurate mapping:
    // - Octaves (2x frequency) → same pattern with 2x more nodes
    // - Based on real Chladni plate physics: f ∝ (m² + n²)

    const normalizedFreq = Math.max(20, Math.min(frequency, 20000));

    // Calculate octaves from 200 Hz reference
    // This ensures 100 Hz = -1 octave → mode 2, staying simple and elegant
    const octavesFrom200Hz = Math.log2(normalizedFreq / 200);

    // Base mode complexity at 200 Hz
    const baseN = 3;
    const baseM = 3;

    // Add octave offset (continuous, allowing negatives for low frequencies)
    // At 100 Hz (-1 octave): ~2,2
    // At 200 Hz (0 octave): 3,3
    // At 400 Hz (+1 octave): 4,3
    // At 800 Hz (+2 octave): 5,4
    const modeN = baseN + octavesFrom200Hz;
    const modeM = baseM + octavesFrom200Hz * 0.8; // Slight asymmetry

    // Clamp to elegant range
    this.targetModeN = Math.max(2, Math.min(8, Math.round(modeN)));
    this.targetModeM = Math.max(2, Math.min(8, Math.round(modeM)));

    // Add fine-tuning within octave (fractional modes for smooth transitions)
    const fractionalOctave = octavesFrom200Hz - Math.floor(octavesFrom200Hz);
    if (fractionalOctave > 0.7) {
      // Close to next octave - blend toward next mode
      this.targetModeN += 0.3;
      this.targetModeM += 0.3;
    }

    // Update particle targets when modes change significantly
    if (
      Math.abs(this.targetModeN - this.currentModeN) > 0.5 ||
      Math.abs(this.targetModeM - this.currentModeM) > 0.5
    ) {
      this.particleSystem.updateTargets(this.targetModeN, this.targetModeM);
    }
  }

  /**
   * Set amplitude for audio reactivity
   */
  setAmplitude(amplitude: number): void {
    this.amplitude = Math.max(0, Math.min(1, amplitude));
  }

  /**
   * Render frame
   */
  render(currentTime: number = 0): void {
    const deltaTime = this.lastFrameTime ? (currentTime - this.lastFrameTime) / 1000 : 0.016;
    this.lastFrameTime = currentTime;

    this.time += deltaTime;

    // Smooth lerp mode transitions
    const lerpSpeed = deltaTime * 2;
    this.currentModeN += (this.targetModeN - this.currentModeN) * lerpSpeed;
    this.currentModeM += (this.targetModeM - this.currentModeM) * lerpSpeed;

    // Get color based on frequency (warm to cool)
    const color = this.getFrequencyColor();

    if (this.gl && this.program) {
      this.renderWebGL(color);
    } else if (this.ctx2d) {
      this.render2D(color);
    }

    // Update and render particles
    this.particleSystem.update(deltaTime, this.amplitude, this.time);
    this.particleSystem.render(color, this.amplitude);
  }

  /**
   * Render using WebGL
   */
  private renderWebGL(color: { r: number; g: number; b: number }): void {
    const gl = this.gl;
    if (!gl || !this.program) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.04, 0.04, 0.06, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Set uniforms
    gl.uniform1f(this.u_modeN, this.currentModeN);
    gl.uniform1f(this.u_modeM, this.currentModeM);
    gl.uniform1f(this.u_time, this.time);
    gl.uniform1f(this.u_amplitude, this.amplitude);
    gl.uniform3f(this.u_color, color.r / 255, color.g / 255, color.b / 255);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * Render using 2D canvas (fallback)
   */
  private render2D(color: { r: number; g: number; b: number }): void {
    const ctx = this.ctx2d;
    if (!ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Simple 2D Chladni pattern approximation
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const normX = (x / width - 0.5) * 2;
        const normY = (y / height - 0.5) * 2;

        const chladni =
          Math.cos(this.currentModeN * Math.PI * normX) *
            Math.cos(this.currentModeM * Math.PI * normY) -
          Math.cos(this.currentModeM * Math.PI * normX) *
            Math.cos(this.currentModeN * Math.PI * normY);

        const intensity = Math.abs(chladni) < 0.1 ? 255 : 0;
        const idx = (y * width + x) * 4;

        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = intensity * this.amplitude;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Get color based on current mode (frequency mapping)
   */
  private getFrequencyColor(): { r: number; g: number; b: number } {
    // Map from warm (low freq) to cool (high freq)
    const t = (this.currentModeN + this.currentModeM) / 16; // 0-1 range

    // Warm amber/gold (low frequencies)
    const warmR = 212;
    const warmG = 175;
    const warmB = 55;

    // Cool silver/blue-white (high frequencies)
    const coolR = 200;
    const coolG = 220;
    const coolB = 255;

    return {
      r: Math.floor(warmR + (coolR - warmR) * t),
      g: Math.floor(warmG + (coolG - warmG) * t),
      b: Math.floor(warmB + (coolB - warmB) * t),
    };
  }

  /**
   * Resize canvases
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.particleCanvas.width = width;
    this.particleCanvas.height = height;

    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }

    this.particleSystem.resize(width, height);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
    if (this.gl && this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
    }
  }
}
