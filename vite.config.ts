import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@store': path.resolve(__dirname, './src/store'),
      '@bridge': path.resolve(__dirname, './src/bridge'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
