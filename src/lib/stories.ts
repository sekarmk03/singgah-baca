import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import {
  countWords,
  deriveUpdatedAt,
  estimateReadingMinutes,
  resolveChapters,
  type ResolvedChapter,
} from './chapters';

export interface Chapter extends ResolvedChapter {
  entry: CollectionEntry<'chapters'>;
  readingMinutes: number;
}

export interface Story {
  slug: string;
  data: CollectionEntry<'stories'>['data'];
  author: CollectionEntry<'authors'>;
  chapters: Chapter[];
  wordCount: number;
  readingMinutes: number;
  updatedAt: Date;
}

/** Drafts are visible while developing and excluded from production builds. */
const includeDrafts = import.meta.env.DEV;

let cachedStories: Promise<Story[]> | undefined;

/** All published stories with derived fields, newest first. */
export function getStories(): Promise<Story[]> {
  cachedStories ??= loadStories();
  return cachedStories;
}

export async function getStory(slug: string): Promise<Story | undefined> {
  return (await getStories()).find((story) => story.slug === slug);
}

async function loadStories(): Promise<Story[]> {
  const storyEntries = await getCollection('stories', ({ data }) => includeDrafts || !data.draft);
  const chapterEntries = await getCollection(
    'chapters',
    ({ data }) => includeDrafts || !data.draft,
  );

  const chaptersByStory = new Map<string, CollectionEntry<'chapters'>[]>();
  for (const entry of chapterEntries) {
    const [storySlug] = entry.id.split('/');
    chaptersByStory.set(storySlug, [...(chaptersByStory.get(storySlug) ?? []), entry]);
  }

  const stories = await Promise.all(
    storyEntries.map(async (entry): Promise<Story> => {
      const author = await getEntry(entry.data.author);
      if (!author) {
        throw new Error(`Story "${entry.id}" references unknown author "${entry.data.author.id}".`);
      }

      const entries = chaptersByStory.get(entry.id) ?? [];
      const entryByFileName = new Map(entries.map((chapter) => [fileNameOf(chapter), chapter]));
      const resolved = resolveChapters(
        entry.id,
        entry.data.category,
        entries.map((chapter) => ({
          fileName: fileNameOf(chapter),
          title: chapter.data.title,
          slug: chapter.data.slug,
          publishedAt: chapter.data.publishedAt,
          draft: chapter.data.draft,
          wordCount: countWords(chapter.body ?? ''),
        })),
      );

      const chapters = resolved.map((chapter) => ({
        ...chapter,
        entry: entryByFileName.get(chapter.fileName)!,
        readingMinutes: estimateReadingMinutes(chapter.wordCount),
      }));
      const wordCount = chapters.reduce((total, chapter) => total + chapter.wordCount, 0);

      return {
        slug: entry.id,
        data: entry.data,
        author,
        chapters,
        wordCount,
        readingMinutes: estimateReadingMinutes(wordCount),
        updatedAt: deriveUpdatedAt(entry.data.publishedAt, resolved),
      };
    }),
  );

  return stories.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

function fileNameOf(chapter: CollectionEntry<'chapters'>): string {
  return chapter.id.split('/')[1];
}
