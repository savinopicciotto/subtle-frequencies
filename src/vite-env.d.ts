/// <reference types="vite/client" />

// GLSL shader file declarations
declare module '*.vert.glsl' {
  const content: string;
  export default content;
}

declare module '*.frag.glsl' {
  const content: string;
  export default content;
}

declare module '*.glsl' {
  const content: string;
  export default content;
}

// Raw imports
declare module '*?raw' {
  const content: string;
  export default content;
}
