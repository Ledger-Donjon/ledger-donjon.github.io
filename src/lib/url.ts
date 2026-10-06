/**
 * Prefixes a site-absolute path with the configured base path, so links keep
 * working when the site is served from a subdirectory (e.g. PR previews).
 */
export const withBase = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
