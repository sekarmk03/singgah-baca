import type { CatalogEntry } from './catalog';
import type { ProgressMap, StoryProgress } from './reading-progress';

export interface RecentReading {
  entry: CatalogEntry;
  progress: StoryProgress;
  url: string;
}

/** Stories with saved progress, most recent first. Progress for removed stories is skipped. */
export function recentReading(
  progress: ProgressMap,
  entries: CatalogEntry[],
  limit = 3,
): RecentReading[] {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  return Object.entries(progress)
    .flatMap(([slug, saved]) => {
      const entry = bySlug.get(slug);
      return entry ? [{ entry, progress: saved, url: `/cerita/${slug}/${saved.chapter}` }] : [];
    })
    .sort((a, b) => b.progress.at.localeCompare(a.progress.at))
    .slice(0, limit);
}
