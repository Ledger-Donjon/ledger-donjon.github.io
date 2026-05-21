import hiddenData from '../data/donjon-blog-hidden.json';

export type DonjonBlogArticle = {
  title: string;
  url: string;
  date?: string | null;
  excerpt?: string;
};

type HiddenEntry = string | { url: string; note?: string };

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

/** Articles listed on donjon.ledger.com (excludes entries in donjon-blog-hidden.json). */
export const filterVisibleDonjonBlogArticles = <T extends { url: string }>(
  articles: T[],
): T[] => {
  const hidden = getHiddenDonjonBlogUrls();
  if (hidden.size === 0) return articles;
  return articles.filter((article) => !hidden.has(normalizeDonjonBlogUrl(article.url)));
};
