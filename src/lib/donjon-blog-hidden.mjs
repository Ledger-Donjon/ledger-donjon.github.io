// Shared by the site (src/lib/donjon-blog.ts) and the fetch script
// (scripts/fetch-donjon-blog.mjs), so it is plain JavaScript that Node can run
// without a TypeScript loader.

/** @typedef {string | { url: string; note?: string }} HiddenEntry */

/** @param {string} url */
export const normalizeDonjonBlogUrl = (url) => url.replace(/\/$/, '').trim().toLowerCase();

/**
 * Normalised URLs from the entries of src/data/donjon-blog-hidden.json.
 * @param {unknown} entries
 * @returns {Set<string>}
 */
export const toHiddenDonjonBlogUrls = (entries) =>
  new Set(
    (Array.isArray(entries) ? /** @type {HiddenEntry[]} */ (entries) : [])
      .map((entry) => (typeof entry === 'string' ? entry : entry?.url))
      .filter((url) => Boolean(url))
      .map(normalizeDonjonBlogUrl),
  );

/**
 * @template {{ url: string }} T
 * @param {T[]} articles
 * @param {Set<string>} hiddenUrls
 * @returns {T[]}
 */
export const filterVisibleDonjonBlogArticles = (articles, hiddenUrls) =>
  hiddenUrls.size === 0
    ? articles
    : articles.filter((article) => !hiddenUrls.has(normalizeDonjonBlogUrl(article.url)));
