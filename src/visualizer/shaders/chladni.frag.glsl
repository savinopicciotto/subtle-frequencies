// Fragment shader for Chladni pattern computation
precision mediump float;

varying vec2 v_texCoord;

uniform float u_modeN;
uniform float u_modeM;
uniform float u_time;
uniform float u_amplitude;
uniform vec3 u_color;

const float PI = 3.14159265359;

void main() {
  // Convert to centered coordinates (-0.5 to 0.5)
  vec2 uv = v_texCoord - 0.5;

  // Convert to circular coordinates
  float r = length(uv) * 2.0;

  // Chladni pattern equation
  // cos(n * pi * x) * cos(m * pi * y) - cos(m * pi * x) * cos(n * pi * y)
  float x = uv.x * 2.0;
  float y = uv.y * 2.0;

  float pattern = cos(u_modeN * PI * x) * cos(u_modeM * PI * y) -
                  cos(u_modeM * PI * x) * cos(u_modeN * PI * y);

  // Add subtle breathing animation
  pattern += sin(u_time * 0.5) * 0.05;

  // Modulate with amplitude for audio reactivity (less extreme)
  pattern *= (0.85 + u_amplitude * 0.15);

  // Create bright nodal lines where pattern ≈ 0
  // The smaller abs(pattern), the brighter the line
  float lineThickness = 0.18 + u_amplitude * 0.08;
  float nodal = 1.0 - smoothstep(0.0, lineThickness, abs(pattern));

  // Add soft glow around nodal lines (stronger base glow)
  float glow = exp(-abs(pattern) * 7.0) * 0.5 * (0.7 + u_amplitude * 0.3);

  // Fade out at edges (circular mask)
  float mask = smoothstep(1.0, 0.6, r);

  // Combine: nodal lines + glow, masked by circle (boosted intensity)
  float intensity = (nodal * 0.9 + glow * 0.8) * mask;

  // Apply color with intensity
  vec3 finalColor = u_color * intensity;

  // Most of the canvas should be black (intensity ≈ 0)
  // Only nodal lines should be bright
  gl_FragColor = vec4(finalColor, 1.0);
}
