/** schema.org data for search engines: a Book (novel) or ShortStory, and its Chapters. */

import { getGenreName } from '../data/genres';
import type { Chapter, Story } from './stories';

const CONTEXT = 'https://schema.org';

function storyType(story: Story): 'Book' | 'ShortStory' {
  return story.data.category === 'novel' ? 'Book' : 'ShortStory';
}

function author(story: Story, site: URL) {
  return {
    '@type': 'Person',
    name: story.author.data.name,
    url: new URL(`/penulis/${story.author.id}`, site).href,
  };
}

export function storyJsonLd(story: Story, site: URL): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': storyType(story),
    name: story.data.title,
    url: new URL(`/cerita/${story.slug}`, site).href,
    author: author(story, site),
    description: story.data.synopsis,
    inLanguage: 'id',
    genre: story.data.genres.map(getGenreName),
    keywords: story.data.tags.join(', ') || undefined,
    datePublished: story.data.publishedAt.toISOString().slice(0, 10),
    dateModified: story.updatedAt.toISOString().slice(0, 10),
    image: new URL(`/og/${story.slug}.png`, site).href,
    wordCount: story.wordCount,
    ...(story.data.category === 'novel' && { numberOfChapters: story.chapters.length }),
  };
}

/** Novel chapters are Chapters of the Book; a short story's reading page is the story itself. */
export function chapterJsonLd(story: Story, chapter: Chapter, site: URL): Record<string, unknown> {
  const storyUrl = new URL(`/cerita/${story.slug}`, site).href;
  if (story.data.category !== 'novel') {
    return {
      ...storyJsonLd(story, site),
      url: new URL(`/cerita/${story.slug}/${chapter.slug}`, site).href,
    };
  }
  return {
    '@context': CONTEXT,
    '@type': 'Chapter',
    name: chapter.title,
    position: chapter.order,
    url: `${storyUrl}/${chapter.slug}`,
    inLanguage: 'id',
    author: author(story, site),
    wordCount: chapter.wordCount,
    ...(chapter.publishedAt && { datePublished: chapter.publishedAt.toISOString().slice(0, 10) }),
    isPartOf: { '@type': 'Book', name: story.data.title, url: storyUrl },
  };
}
