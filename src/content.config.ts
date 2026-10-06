import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const lsb = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lsb' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
  }),
});

const threatModel = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/threat-model' }),
  schema: z.object({
    title: z.string(),
  }),
});

const blog = defineCollection({
  // Exclude underscore-prefixed files (e.g. _welcome-donjon-blog.md) so internal
  // guides never become published pages, in dev or production.
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    image: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  lsb,
  'threat-model': threatModel,
  blog,
};
