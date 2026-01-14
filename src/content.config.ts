import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lsb = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lsb' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    layout: z.string().optional(),
  }),
});

const threatModel = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/threat-model' }),
  schema: z.object({
    title: z.string(),
    layout: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    permalink: z.string().optional(),
    layout: z.string().optional(),
  }),
});

export const collections = {
  lsb,
  'threat-model': threatModel,
  pages,
};
