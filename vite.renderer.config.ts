import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-renderer',
  },
  resolve: {
    alias: {
      // Evitar problemas com módulos Node.js no renderer
    },
  },
});
