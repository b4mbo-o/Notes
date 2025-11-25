// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://notes.b4mboo.net',
  integrations: [sitemap()],
  vite: {
    server: {
      // dev.b4mboo.net からのアクセスを許可
      allowedHosts: ['dev.b4mboo.net'],
    },
  },
});
