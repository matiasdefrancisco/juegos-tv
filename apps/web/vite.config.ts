import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@party-draw/shared': path.resolve(__dirname, '../../packages/shared/dist/index.js')
    }
  },
  server: {
    port: 5173,
    host: true // exposes to local network for phones to connect
  }
});
