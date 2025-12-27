import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  base: './',
  // Important: Don't set root here, let Forge handle it
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'floating_window.html'),
    },
  },
  resolve: {
    alias: {},
  },
  server: {
    // This is key - tell Vite dev server to use floating_window.html as index
    fs: {
      strict: false,
    },
  },
  // Override the default index.html with our floating_window.html
  plugins: [
    {
      name: 'floating-window-entry',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Redirect root requests to floating_window.html
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/floating_window.html';
          }
          next();
        });
      },
    },
  ],
});
