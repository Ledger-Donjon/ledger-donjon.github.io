import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CATEGORY_URL = 'https://www.ledger.com/blog/category/donjon';
const PROXY_PREFIX = 'https://r.jina.ai/http://';
const MAX_PAGES = 12;
const REQUEST_TIMEOUT_MS = 6000;
const CONCURRENCY = 3;

const toProxyUrl = (url) => `${PROXY_PREFIX}${url.replace(/^https?:\/\//, '')}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '..', 'src', 'data', 'donjon-blog.json');

const parseDateValue = (value) => {
  if (!value) return null;
  const [month, day, year] = value.split('/').map((part) => Number(part));
  if (!month || !day || !year) return null;
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
};

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; DonjonBlogBot/1.0)',
  Accept: 'text/plain, text/markdown;q=0.9, */*;q=0.8',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (url, timeoutMs = REQUEST_TIMEOUT_MS, retries = 3) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: DEFAULT_HEADERS });
      if (response.status === 429 && attempt < retries) {
        const backoff = 1000 * (attempt + 1);
        console.warn(`Rate limited (${response.status}) for ${url}. Retry ${attempt + 1}/${retries} in ${backoff}ms.`);
        await delay(backoff);
        continue;
      }
      if (!response.ok && attempt < retries) {
        const backoff = 400 * (attempt + 1);
        console.warn(`Fetch failed (${response.status}) for ${url}. Retry ${attempt + 1}/${retries} in ${backoff}ms.`);
        await delay(backoff);
        continue;
      }
      return response;
    } catch (error) {
      if (attempt >= retries) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Fetch error for ${url}: ${message}`);
      }
      const backoff = 400 * (attempt + 1);
      console.warn(`Fetch error for ${url}. Retry ${attempt + 1}/${retries} in ${backoff}ms.`);
      await delay(backoff);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`Failed to fetch after retries: ${url}`);
};

const extractArticles = (markdown, seen) => {
  const lines = markdown.split('\n');
  const linkRegex = /\[[^\]]*\]\((https:\/\/www\.ledger\.com\/[^)\s]+)\s+"([^"]+)"\)/;
  const dateRegex = /\|\s*(\d{2}\/\d{2}\/\d{4})/;
  const entries = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(linkRegex);
    if (!match) continue;

    const url = match[1];
    const title = match[2]?.trim();

    if (!url || !title) continue;
    if (url.includes('/blog/category/') || url.includes('/blog/page/')) continue;
    if (url.includes('/blog/tag/') || url.includes('/blog/author/')) continue;
    if (seen.has(url)) continue;

    let date = null;
    for (let j = i + 1; j < Math.min(i + 7, lines.length); j += 1) {
      const dateMatch = lines[j].match(dateRegex);
      if (dateMatch) {
        date = parseDateValue(dateMatch[1]);
        break;
      }
    }

    let excerpt = '';
    for (let j = i + 1; j < Math.min(i + 9, lines.length); j += 1) {
      const candidate = lines[j].trim();
      if (!candidate) continue;
      if (candidate.startsWith('[') || candidate.startsWith('![')) continue;
      excerpt = candidate.replace(/\s+$/, '');
      break;
    }

    entries.push({ title, url, date, excerpt });
    seen.add(url);
  }

  return entries;
};

const isExcerptPlaceholder = (excerpt) => {
  if (!excerpt) return true;
  const normalized = excerpt.replace(/\s+/g, '').trim();
  if (normalized === '***' || normalized === '...') return true;
  if (excerpt.trim().toLowerCase() === 'tl;dr') return true;
  return false;
};

const extractExcerptFromArticle = (markdown) => {
  const lines = markdown.split('\n');
  const startIndex = lines.findIndex((line) => line.startsWith('Markdown Content:'));
  if (startIndex === -1) return '';

  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;
    if (rawLine.startsWith('#')) continue;
    if (rawLine.startsWith('![')) continue;
    if (rawLine.startsWith('[') && rawLine.includes('](')) continue;
    if (/^[-*]\s+/.test(rawLine)) continue;

    const cleaned = rawLine.replace(/^[_*]+/, '').replace(/[_*]+$/, '').trim();
    if (!cleaned) continue;
    return cleaned;
  }

  return '';
};

const extractMaxPage = (markdown) => {
  const pageRegex = /https:\/\/www\.ledger\.com\/blog\/category\/donjon\/page\/(\d+)/g;
  let max = 1;
  let match;
  while ((match = pageRegex.exec(markdown)) !== null) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      max = Math.max(max, value);
    }
  }
  return Math.min(max, MAX_PAGES);
};

const mapWithConcurrency = async (items, limit, worker) => {
  const results = new Array(items.length);
  let index = 0;

  const runWorker = async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  };

  const runners = Array.from({ length: Math.min(limit, items.length) }, runWorker);
  await Promise.all(runners);
  return results;
};

const readExisting = async () => {
  try {
    const raw = await readFile(outputPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeOutput = async (articles) => {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const payload = JSON.stringify(articles, null, 2);
  await writeFile(outputPath, `${payload}\n`, 'utf8');
};

const run = async () => {
  const fallback = await readExisting();
  const seen = new Set();
  let articles = [];

  try {
    const firstResponse = await fetchWithTimeout(toProxyUrl(CATEGORY_URL));
    if (!firstResponse.ok) {
      throw new Error(`Failed to fetch blog list: ${firstResponse.status}`);
    }
    const firstMarkdown = await firstResponse.text();
    articles = extractArticles(firstMarkdown, seen);

    const maxPage = extractMaxPage(firstMarkdown);
    const pageUrls = Array.from({ length: maxPage - 1 }, (_, idx) =>
      `${CATEGORY_URL}/page/${idx + 2}`,
    );

    if (pageUrls.length > 0) {
      const pageResults = await mapWithConcurrency(pageUrls, CONCURRENCY, async (url) => {
        const response = await fetchWithTimeout(toProxyUrl(url));
        if (!response.ok) return [];
        const markdown = await response.text();
        return extractArticles(markdown, seen);
      });
      articles = articles.concat(...pageResults);
    }

    articles = articles.filter((article) => article.url && article.title);

    const needsDetailFetch = articles.filter((article) => isExcerptPlaceholder(article.excerpt));
    if (needsDetailFetch.length > 0) {
      const detailResults = await mapWithConcurrency(needsDetailFetch, CONCURRENCY, async (article) => {
        const response = await fetchWithTimeout(toProxyUrl(article.url));
        if (!response.ok) return { url: article.url, excerpt: '' };
        const markdown = await response.text();
        return {
          url: article.url,
          excerpt: extractExcerptFromArticle(markdown),
        };
      });
      const detailMap = new Map(detailResults.map((result) => [result.url, result]));
      articles = articles.map((article) => {
        const detail = detailMap.get(article.url);
        if (!detail) return article;
        return {
          ...article,
          excerpt: detail.excerpt || article.excerpt,
        };
      });
    }

    articles = articles.map(({ author, ...rest }) => rest);

    articles.sort((a, b) => {
      const aTime = a.date ? Date.parse(a.date) : 0;
      const bTime = b.date ? Date.parse(b.date) : 0;
      return bTime - aTime;
    });

    if (articles.length === 0) {
      console.warn('No articles detected, preserving existing data if available.');
      await writeOutput(fallback);
    } else {
      await writeOutput(articles);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to refresh Donjon blog data, preserving existing data. ${message}`);
    if (fallback.length === 0) {
      await writeOutput([]);
    }
  }
};

run();
