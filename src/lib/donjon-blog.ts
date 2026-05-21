import { getCollection } from 'astro:content';
import hiddenData from '../data/donjon-blog-hidden.json';
import externalArticlesData from '../data/donjon-blog.json';

export type DonjonBlogArticle = {
  title: string;
  url: string;
  date?: string | null;
  excerpt?: string;
};

export type DonjonBlogListItem = {
  title: string;
  date: string | null;
  excerpt: string;
  source: 'external' | 'local';
  href: string;
  openInNewTab: boolean;
  slug?: string;
};

type HiddenEntry = string | { url: string; note?: string };

const toIsoDate = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const parseListDate = (value: string | null): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const normalizeDonjonBlogUrl = (url: string): string =>
  url.replace(/\/$/, '').trim().toLowerCase();

export const getHiddenDonjonBlogUrls = (): Set<string> => {
  const entries = (Array.isArray(hiddenData) ? hiddenData : []) as HiddenEntry[];
  return new Set(
    entries
      .map((entry) => (typeof entry === 'string' ? entry : entry?.url))
      .filter((url): url is string => Boolean(url))
      .map(normalizeDonjonBlogUrl),
  );
};

/** Corporate blog articles (excludes entries in donjon-blog-hidden.json). */
export const filterVisibleDonjonBlogArticles = <T extends { url: string }>(
  articles: T[],
): T[] => {
  const hidden = getHiddenDonjonBlogUrls();
  if (hidden.size === 0) return articles;
  return articles.filter((article) => !hidden.has(normalizeDonjonBlogUrl(article.url)));
};

export const getExternalDonjonBlogPosts = (): DonjonBlogListItem[] => {
  const articles = Array.isArray(externalArticlesData) ? externalArticlesData : [];
  return filterVisibleDonjonBlogArticles(articles).map((article) => ({
    title: article.title,
    date: toIsoDate(article.date ?? null),
    excerpt: article.excerpt ?? '',
    source: 'external' as const,
    href: article.url,
    openInNewTab: true,
  }));
};

export const getLocalDonjonBlogPosts = async (
  withBase: (path: string) => string,
): Promise<DonjonBlogListItem[]> => {
  const entries = await getCollection('blog');
  const includeDrafts = !import.meta.env.PROD;

  return entries
    .filter((entry) => includeDrafts || !entry.data.draft)
    .map((entry) => {
      const slug = entry.id.replace(/\.md$/, '');
      return {
        title: entry.data.title,
        date: toIsoDate(entry.data.date),
        excerpt: entry.data.excerpt,
        source: 'local' as const,
        href: withBase(`/blog/${slug}/`),
        openInNewTab: false,
        slug,
      };
    });
};

export const getMergedDonjonBlogArticles = async (
  withBase: (path: string) => string,
): Promise<DonjonBlogListItem[]> => {
  const local = await getLocalDonjonBlogPosts(withBase);
  const external = getExternalDonjonBlogPosts();
  const merged = [...local, ...external];

  return merged.sort((a, b) => parseListDate(b.date) - parseListDate(a.date));
};
