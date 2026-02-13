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
  float x = uv.x * 2.0;
  float y = uv.y * 2.0;

  float pattern = cos(u_modeN * PI * x) * cos(u_modeM * PI * y) -
                  cos(u_modeM * PI * x) * cos(u_modeN * PI * y);

  // Add subtle breathing animation
  pattern += sin(u_time * 0.5) * 0.03;

  // Bold nodal lines - thick and bright like real Chladni plates
  float lineThickness = 0.25;
  float nodal = 1.0 - smoothstep(0.0, lineThickness, abs(pattern));

  // Strong glow around lines
  float glow = exp(-abs(pattern) * 4.0) * 0.6;

  // Fade out at edges (circular mask)
  float mask = smoothstep(1.0, 0.55, r);

  // Full brightness - bold lines on black
  float intensity = clamp((nodal + glow) * 1.2, 0.0, 1.0) * mask;

  // Apply color with intensity
  vec3 finalColor = u_color * intensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
