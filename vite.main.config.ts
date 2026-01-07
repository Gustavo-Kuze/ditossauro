import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
// Some native modules need to be treated as external
// especially in the main process
    alias: {},
  },
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: [
        'electron',
        'robotjs',
        'assemblyai',
        'groq-sdk',
        'uuid',
        'uiohook-napi',
        'fs',
        'path',
        'os'
      ],
    },
  },
});
