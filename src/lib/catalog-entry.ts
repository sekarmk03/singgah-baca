import type { CatalogEntry } from './catalog';
import type { Story } from './stories';

const SYNOPSIS_LENGTH = 160;

/** Shortens text at a word boundary, adding an ellipsis when cut. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function toCatalogEntry(story: Story): CatalogEntry {
  return {
    slug: story.slug,
    title: story.data.title,
    authorName: story.author.data.name,
    authorSlug: story.author.id,
    category: story.data.category,
    genres: story.data.genres,
    tags: story.data.tags,
    status: story.data.status,
    synopsis: truncate(story.data.synopsis, SYNOPSIS_LENGTH),
    chapterCount: story.chapters.length,
    readingMinutes: story.readingMinutes,
    publishedAt: story.data.publishedAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
  };
}
