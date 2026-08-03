import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 1. Group motion library together first to avoid circular chunks
              if (id.includes('node_modules/motion') || id.includes('node_modules/@motion')) {
                return 'vendor-motion';
              }
              // 2. Group icons
              if (id.includes('node_modules/lucide-react')) {
                return 'vendor-icons';
              }
              // 3. Group recharts
              if (id.includes('node_modules/recharts')) {
                return 'vendor-recharts';
              }
              // 4. Group jspdf
              if (id.includes('node_modules/jspdf')) {
                return 'vendor-jspdf';
              }
              // 5. Group state management & query
              if (
                id.includes('node_modules/@tanstack') ||
                id.includes('node_modules/zustand') ||
                id.includes('node_modules/axios')
              ) {
                return 'vendor-state-query';
              }
              // 6. Core React & UI framework (strict directory matches)
              if (
                id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-router/') ||
                id.includes('node_modules/react-router-dom/') ||
                id.includes('node_modules/@mui/') ||
                id.includes('node_modules/@emotion/') ||
                id.includes('node_modules/react-hook-form/')
              ) {
                return 'vendor-framework';
              }
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/backend/**']
      },
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/ws': {
          target: 'http://localhost:8080',
          ws: true,
          changeOrigin: true,
        }
      }
    },
  };
});
