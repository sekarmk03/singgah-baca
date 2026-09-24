/**
 * Pure helpers for deriving chapter order, slugs and reading time.
 * Kept free of `astro:content` imports so they can be unit-tested with Vitest.
 */

export type StoryCategory = 'short-story' | 'novel';

/** Fixed chapter slug for short stories, giving `/cerita/[slug]/baca`. */
export const SHORT_STORY_CHAPTER_SLUG = 'baca';

export const WORDS_PER_MINUTE = 200;

export interface ChapterSource {
  /** File name without extension, e.g. `01-kereta-yang-terlambat`. */
  fileName: string;
  title: string;
  slug?: string;
  publishedAt?: Date;
  draft: boolean;
  wordCount: number;
}

export interface ResolvedChapter extends ChapterSource {
  order: number;
  slug: string;
}

const FILE_NAME_PATTERN = /^(\d+)-(.+)$/;

export function parseChapterFileName(fileName: string): { order: number; baseSlug: string } {
  const match = FILE_NAME_PATTERN.exec(fileName);
  if (!match) {
    throw new Error(
      `Chapter file "${fileName}.md" must start with an order number, e.g. "01-${fileName}.md".`,
    );
  }
  return { order: Number(match[1]), baseSlug: match[2] };
}

/**
 * Sorts chapters by their file-name prefix and assigns final URL slugs.
 * Throws when a story has duplicate orders or slugs, or a short story has more than one chapter,
 * so broken content fails the build instead of producing broken URLs.
 */
export function resolveChapters(
  storyId: string,
  category: StoryCategory,
  sources: ChapterSource[],
): ResolvedChapter[] {
  if (sources.length === 0) {
    throw new Error(`Story "${storyId}" has no chapters.`);
  }
  if (category === 'short-story' && sources.length > 1) {
    throw new Error(
      `Story "${storyId}" is a short story but has ${sources.length} chapter files; it must have exactly 1.`,
    );
  }

  const chapters = sources.map((source) => {
    const { order, baseSlug } = parseChapterFileName(source.fileName);
    const slug = category === 'short-story' ? SHORT_STORY_CHAPTER_SLUG : (source.slug ?? baseSlug);
    return { ...source, order, slug };
  });

  assertUnique(
    storyId,
    'order number',
    chapters.map((chapter) => String(chapter.order)),
  );
  assertUnique(
    storyId,
    'slug',
    chapters.map((chapter) => chapter.slug),
  );

  return chapters.sort((a, b) => a.order - b.order);
}

function assertUnique(storyId: string, label: string, values: string[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Story "${storyId}" has more than one chapter with ${label} "${value}".`);
    }
    seen.add(value);
  }
}

/** Counts words in Markdown source, ignoring syntax such as `#`, `*`, `>` and link targets. */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ');
  const words = text.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu);
  return words?.length ?? 0;
}

export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

/** Latest chapter publication date, falling back to the story's own date. */
export function deriveUpdatedAt(storyPublishedAt: Date, chapters: ChapterSource[]): Date {
  return chapters.reduce<Date>(
    (latest, chapter) =>
      chapter.publishedAt && chapter.publishedAt > latest ? chapter.publishedAt : latest,
    storyPublishedAt,
  );
}
