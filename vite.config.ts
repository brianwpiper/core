import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './web',
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
