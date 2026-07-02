import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const includeDrafts = !import.meta.env.PROD;
  const posts = (await getCollection('blog'))
    .filter((post) => includeDrafts || !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Ledger Donjon Blog',
    description: 'Security research from the Donjon team at Ledger.',
    site: context.site ?? 'https://donjon.ledger.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date,
      link: `/blog/${post.id.replace(/\.md$/, '')}/`,
    })),
  });
}
