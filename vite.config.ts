import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    // Two pages: the game (index.html) and the 2D plan check (plan.html).
    rollupOptions: { input: { game: resolve(__dirname, 'index.html'), plan: resolve(__dirname, 'plan.html') } },
  },
});
