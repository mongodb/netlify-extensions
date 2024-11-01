import react from '@vitejs/plugin-react';
import autoprefixerPlugin from 'autoprefixer';
import tailwindcssPlugin from 'tailwindcss';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '',
  build: {
    outDir: '../../.ntli/site/static/ui',
  },
  root: './src/ui',
  plugins: [react()],
  server: {
    strictPort: true,
  },
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [autoprefixerPlugin, tailwindcssPlugin],
    },
  },
}));
