// Vertex shader for Chladni pattern
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  // Pass through position
  gl_Position = vec4(a_position, 0.0, 1.0);

  // Convert from clip space (-1 to 1) to texture coordinates (0 to 1)
  v_texCoord = a_position * 0.5 + 0.5;
}
