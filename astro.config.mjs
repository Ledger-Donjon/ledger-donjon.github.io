import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Support PR preview deployments with custom base path.
const base = process.env.PREVIEW_BASE || '/';
const site = process.env.PREVIEW_SITE || 'https://donjon.ledger.com';

const withBase = (url) => {
  if (typeof url !== 'string') {
    return url;
  }
  if (url.startsWith('//') || !url.startsWith('/')) {
    return url;
  }
  return `${base}${url.replace(/^\/+/, '')}`;
};

const prefixMarkdownBase = () => (tree) => {
  const visit = (node) => {
    if (node?.type === 'element' && node?.properties) {
      if (node.tagName === 'a' && node.properties.href) {
        node.properties.href = withBase(node.properties.href);
      }
      if (node.tagName === 'img' && node.properties.src) {
        node.properties.src = withBase(node.properties.src);
      }
    }
    if (node?.children?.length) {
      node.children.forEach(visit);
    }
  };
  visit(tree);
};

// https://astro.build/config
export default defineConfig({
  site: site,
  base: base,
  output: 'static',
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
  integrations: [sitemap()],
  build: {
    assets: '_astro'
  },
  markdown: {
    rehypePlugins: [prefixMarkdownBase],
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
