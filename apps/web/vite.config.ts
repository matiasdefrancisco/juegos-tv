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
    host: true // expone el server a la red local para que entren los celulares
  },
  preview: {
    port: 4173,
    host: true
  },
  build: {
    // Los navegadores de smart TV suelen ir varios años atrasados
    target: 'es2018',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Separa lo que casi nunca cambia para aprovechar la caché entre deploys
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          realtime: ['socket.io-client']
        }
      }
    }
  }
});
