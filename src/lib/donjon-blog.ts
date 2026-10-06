import { getCollection } from 'astro:content';
import hiddenData from '../data/donjon-blog-hidden.json';
import externalArticlesData from '../data/donjon-blog.json';
import { filterVisibleDonjonBlogArticles, toHiddenDonjonBlogUrls } from './donjon-blog-hidden.mjs';
import { withBase } from './url';

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

export const getExternalDonjonBlogPosts = (): DonjonBlogListItem[] => {
  const articles = Array.isArray(externalArticlesData) ? externalArticlesData : [];
  const hiddenUrls = toHiddenDonjonBlogUrls(hiddenData);
  return filterVisibleDonjonBlogArticles(articles, hiddenUrls).map((article) => ({
    title: article.title,
    date: toIsoDate(article.date ?? null),
    excerpt: article.excerpt ?? '',
    source: 'external' as const,
    href: article.url,
    openInNewTab: true,
  }));
};

export const getLocalDonjonBlogPosts = async (): Promise<DonjonBlogListItem[]> => {
  const entries = await getCollection('blog');
  const includeDrafts = !import.meta.env.PROD;

  return entries
    .filter((entry) => includeDrafts || !entry.data.draft)
    .map((entry) => {
      const slug = entry.id;
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

export const getMergedDonjonBlogArticles = async (): Promise<DonjonBlogListItem[]> => {
  const local = await getLocalDonjonBlogPosts();
  const external = getExternalDonjonBlogPosts();
  const merged = [...local, ...external];

  return merged.sort((a, b) => parseListDate(b.date) - parseListDate(a.date));
};
