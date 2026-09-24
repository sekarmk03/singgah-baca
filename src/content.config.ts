import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { genreSlugs } from './data/genres';

const STORIES_DIR = './src/content/stories';

const authors = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/authors' }),
  schema: z.object({
    name: z.string().min(1),
    bio: z.string().optional(),
    links: z.array(z.object({ label: z.string().min(1), url: z.url() })).optional(),
  }),
});

const stories = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: STORIES_DIR,
    // The story id is its folder name, e.g. `hujan-di-stasiun-terakhir`.
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      author: reference('authors'),
      category: z.enum(['short-story', 'novel']),
      genres: z.array(z.enum(genreSlugs)).min(1),
      tags: z.array(z.string().min(1)).default([]),
      status: z.enum(['completed', 'ongoing']),
      synopsis: z.string().min(1).max(400),
      cover: image().optional(),
      publishedAt: z.coerce.date(),
      draft: z.boolean().default(false),
    }),
});

const chapters = defineCollection({
  loader: glob({
    pattern: ['*/*.md', '!*/index.md'],
    base: STORIES_DIR,
    // Keep the raw `<story>/<file name>` path so ordering and slugs can be derived from it.
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by hyphens')
      .optional(),
    publishedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { authors, stories, chapters };
