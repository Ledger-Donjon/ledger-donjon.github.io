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
    // Raw HTML embedded in Markdown (e.g. <figure><img src="/…">) is passed
    // through as `raw`/`html` nodes and never becomes an `element`, so rewrite
    // its absolute src/href attributes directly on the HTML string.
    if ((node?.type === 'raw' || node?.type === 'html') && typeof node.value === 'string') {
      node.value = node.value.replace(
        /\b(src|href)=("|')(\/[^"']*)\2/g,
        (match, attr, quote, url) => `${attr}=${quote}${withBase(url)}${quote}`
      );
    }
    if (node?.children?.length) {
      node.children.forEach(visit);
    }
  };
  visit(tree);
};

// Wrap standalone images that have alt text into <figure>/<figcaption>.
// Targets the common Markdown pattern: <p><img alt="caption" src="…"></p>
const rehypeImageFigure = () => (tree) => {
  const walk = (node) => {
    if (node?.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (
          child.type === 'element' &&
          child.tagName === 'p' &&
          child.children?.length === 1 &&
          child.children[0].type === 'element' &&
          child.children[0].tagName === 'img'
        ) {
          const img = child.children[0];
          const alt = img.properties?.alt;
          if (alt) {
            node.children[i] = {
              type: 'element',
              tagName: 'figure',
              properties: {},
              children: [
                img,
                {
                  type: 'element',
                  tagName: 'figcaption',
                  properties: {},
                  children: [{ type: 'text', value: alt }],
                },
              ],
            };
          }
        }
        walk(child);
      }
    }
  };
  walk(tree);
};

// Tag inline <code> that contains hex values with a data attribute for styling.
const rehypeHexCode = () => (tree) => {
  const hexPattern = /^(0x[0-9a-fA-F]+|[0-9a-fA-F]{4,})$/;
  const walk = (node) => {
    if (
      node?.type === 'element' &&
      node.tagName === 'code' &&
      node.children?.length === 1 &&
      node.children[0].type === 'text' &&
      hexPattern.test(node.children[0].value.trim())
    ) {
      node.properties = node.properties || {};
      node.properties.dataHex = '';
    }
    node?.children?.forEach(walk);
  };
  walk(tree);
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
    rehypePlugins: [rehypeImageFigure, rehypeHexCode, prefixMarkdownBase],
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
