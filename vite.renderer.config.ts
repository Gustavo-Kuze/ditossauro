import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      // Avoid problems with Node.js modules in renderer
    },
  },
});
