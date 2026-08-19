import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@party-draw/shared': path.resolve(rootDir, '../../packages/shared/dist/index.js')
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
        /**
         * Separa lo que casi nunca cambia para aprovechar la caché entre deploys.
         *
         * Tiene que ser una función: Vite 8 usa Rolldown, que a diferencia de
         * Rollup no acepta la forma de objeto `{ chunk: [paquetes] }`.
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;

          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (id.includes('socket.io') || id.includes('engine.io')) return 'realtime';

          return;
        }
      }
    }
  }
});
