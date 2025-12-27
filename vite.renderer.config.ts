import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      // Evitar problemas com módulos Node.js no renderer
    },
  },
});
