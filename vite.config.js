import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    open: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    cssCodeSplit: true,
  },
  define: {
    'process.env': {}, // For backward compatibility if any lib still uses process.env
  },
});
