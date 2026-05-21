import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hiddenPath = path.resolve(__dirname, '..', 'src', 'data', 'donjon-blog-hidden.json');

export const normalizeDonjonBlogUrl = (url) => url.replace(/\/$/, '').trim().toLowerCase();

export const readHiddenDonjonBlogUrls = async () => {
  try {
    const raw = await readFile(hiddenPath, 'utf8');
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed) ? parsed : [];
    return new Set(
      entries
        .map((entry) => (typeof entry === 'string' ? entry : entry?.url))
        .filter(Boolean)
        .map(normalizeDonjonBlogUrl),
    );
  } catch {
    return new Set();
  }
};

export const filterVisibleDonjonBlogArticles = (articles, hiddenUrls) =>
  articles.filter((article) => !hiddenUrls.has(normalizeDonjonBlogUrl(article.url)));
