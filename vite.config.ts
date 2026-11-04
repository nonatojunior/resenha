import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const productionBase = process.env.VITE_BASE_PATH ?? '/resenha/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? productionBase : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
    restoreMocks: true,
  },
}));
