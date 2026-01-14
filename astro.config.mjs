import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Support PR preview deployments with custom base path
const base = process.env.PREVIEW_BASE || '/';
const site = process.env.PREVIEW_SITE || 'https://donjon.ledger.com';

// https://astro.build/config
export default defineConfig({
  site: site,
  base: base,
  output: 'static',
  integrations: [sitemap()],
  build: {
    assets: '_astro'
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
});
