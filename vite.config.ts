import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Root index.html is at project root (default)
  build: {
    outDir: 'dist/client',   // server.ts serves from dist/client/
    emptyOutDir: true,
  },
  // In dev mode, proxy /api/* to the Express server
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
