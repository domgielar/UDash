import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/grabngo-menu': 'http://localhost:3001',
          '/calculate-delivery-fee': 'http://localhost:3001',
          '/place-order': 'http://localhost:3001'
        }
      },
      preview: {
        // allow hosting preview on the external host used by your deployment / tunneling
        allowedHosts: ['www.udash.tech']
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__VITE_API_URL__': JSON.stringify(env.VITE_API_URL || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
