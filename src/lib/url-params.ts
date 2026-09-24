/**
 * The catalog's query parameters are user-facing, so names and values are Indonesian.
 * This is the single place that maps them to the English values used in code.
 */

import type { StoryCategory } from './chapters';

export type StoryStatus = 'completed' | 'ongoing';
export type Duration = 'short' | 'medium' | 'long';
export type SortOrder = 'relevance' | 'newest' | 'updated' | 'title' | 'shortest';

export const PARAM_NAMES = {
  query: 'q',
  category: 'kategori',
  genres: 'genre',
  authors: 'penulis',
  status: 'status',
  duration: 'durasi',
  sort: 'urut',
  pages: 'hal',
} as const;

export const CATEGORY_PARAM: Record<StoryCategory, string> = {
  'short-story': 'cerpen',
  novel: 'novel',
};

export const STATUS_PARAM: Record<StoryStatus, string> = {
  completed: 'tamat',
  ongoing: 'bersambung',
};

export const DURATION_PARAM: Record<Duration, string> = {
  short: 'pendek',
  medium: 'sedang',
  long: 'panjang',
};

export const SORT_PARAM: Record<SortOrder, string> = {
  relevance: 'relevan',
  newest: 'terbaru',
  updated: 'diperbarui',
  title: 'judul',
  shortest: 'terpendek',
};

/** Reverse lookup: URL value → code value, or undefined for anything unknown. */
export function fromParam<T extends string>(
  mapping: Record<T, string>,
  value: string | null,
): T | undefined {
  if (value === null) return undefined;
  return (Object.keys(mapping) as T[]).find((key) => mapping[key] === value);
}

export function toParam<T extends string>(mapping: Record<T, string>, value: T): string {
  return mapping[value];
}
