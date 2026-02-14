import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  site: 'https://arcade-cabinet.github.io',
  base: '/psyduck-panic',
  outDir: './dist',
  build: {
    assets: 'assets',
  },
});
