import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Alguns módulos nativos precisam ser tratados como externos
    // especialmente no processo principal
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
        'node-record-lpcm16',
        'form-data',
        'axios',
        'uuid',
        'fs',
        'path',
        'os'
      ],
    },
  },
});
