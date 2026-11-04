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
    // Os testes exercitam o repositório de demonstração. Sem isso, o Vitest herda as
    // variáveis VITE_SUPABASE_* do ambiente/CI e as páginas passam a chamar a rede.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
}));
