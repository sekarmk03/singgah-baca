import Fuse from 'fuse.js/basic';
import type { CatalogEntry, SearchRanking } from './catalog';

/** Builds a typo-tolerant title/author/tag search. Returns rank by slug (0 = best). */
export function createSearch(entries: CatalogEntry[]): (query: string) => SearchRanking {
  const fuse = new Fuse(entries, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'authorName', weight: 0.2 },
      { name: 'tags', weight: 0.1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    ignoreDiacritics: true,
  });

  return (query) => {
    const trimmed = query.trim();
    if (!trimmed) return undefined;
    return new Map(fuse.search(trimmed).map((result, rank) => [result.item.slug, rank]));
  };
}
