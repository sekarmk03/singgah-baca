/**
 * Catalog filtering, faceting and sorting. Pure functions over the search index so they can be
 * unit-tested and benchmarked without a browser.
 */

import type { StoryCategory } from './chapters';
import {
  CATEGORY_PARAM,
  DURATION_PARAM,
  fromParam,
  PARAM_NAMES,
  SORT_PARAM,
  STATUS_PARAM,
  type Duration,
  type SortOrder,
  type StoryStatus,
} from './url-params';

export const PAGE_SIZE = 24;
const MAX_PAGES = 1000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** One story in `search-index.json`. Dates are ISO strings. */
export interface CatalogEntry {
  slug: string;
  title: string;
  authorName: string;
  authorSlug: string;
  category: StoryCategory;
  genres: string[];
  tags: string[];
  status: StoryStatus;
  synopsis: string;
  chapterCount: number;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
}

export interface CatalogState {
  query: string;
  category?: StoryCategory;
  genres: string[];
  authors: string[];
  status?: StoryStatus;
  duration?: Duration;
  /** Only set when the reader picked an order explicitly. */
  sort?: SortOrder;
  /** Number of PAGE_SIZE blocks shown. */
  pages: number;
}

export const EMPTY_STATE: CatalogState = { query: '', genres: [], authors: [], pages: 1 };

export type FacetGroup = 'category' | 'genres' | 'authors' | 'status' | 'duration';

export type FacetCounts = Record<FacetGroup, Record<string, number>>;

export interface CatalogResult {
  /** All matching entries in display order (not yet paginated). */
  entries: CatalogEntry[];
  facets: FacetCounts;
}

/** Ranks by slug from a text search; `undefined` means "no query, everything matches". */
export type SearchRanking = Map<string, number> | undefined;

export function durationOf(readingMinutes: number): Duration {
  if (readingMinutes < 10) return 'short';
  if (readingMinutes <= 60) return 'medium';
  return 'long';
}

export function defaultSort(query: string): SortOrder {
  return query.trim() ? 'relevance' : 'newest';
}

export function effectiveSort(state: CatalogState): SortOrder {
  const sort = state.sort ?? defaultSort(state.query);
  // Relevance only means something when there is a query.
  return sort === 'relevance' && !state.query.trim() ? 'newest' : sort;
}

export function activeFilterCount(state: CatalogState): number {
  return (
    Number(Boolean(state.category)) +
    state.genres.length +
    state.authors.length +
    Number(Boolean(state.status)) +
    Number(Boolean(state.duration))
  );
}

export function parseState(params: URLSearchParams, knownGenres: readonly string[]): CatalogState {
  const list = (name: string) =>
    unique((params.get(name) ?? '').split(',').filter((value) => SLUG_PATTERN.test(value)));
  const pages = Number.parseInt(params.get(PARAM_NAMES.pages) ?? '1', 10);

  return {
    query: (params.get(PARAM_NAMES.query) ?? '').slice(0, 100),
    category: fromParam(CATEGORY_PARAM, params.get(PARAM_NAMES.category)),
    genres: list(PARAM_NAMES.genres).filter((genre) => knownGenres.includes(genre)),
    authors: list(PARAM_NAMES.authors),
    status: fromParam(STATUS_PARAM, params.get(PARAM_NAMES.status)),
    duration: fromParam(DURATION_PARAM, params.get(PARAM_NAMES.duration)),
    sort: fromParam(SORT_PARAM, params.get(PARAM_NAMES.sort)),
    pages: Number.isFinite(pages) ? Math.min(MAX_PAGES, Math.max(1, pages)) : 1,
  };
}

/** Serializes only non-default values, in a stable order, so equal states give equal URLs. */
export function serializeState(state: CatalogState): URLSearchParams {
  const params = new URLSearchParams();
  const query = state.query.trim();
  if (query) params.set(PARAM_NAMES.query, query);
  if (state.category) params.set(PARAM_NAMES.category, CATEGORY_PARAM[state.category]);
  if (state.genres.length) params.set(PARAM_NAMES.genres, state.genres.join(','));
  if (state.authors.length) params.set(PARAM_NAMES.authors, state.authors.join(','));
  if (state.status) params.set(PARAM_NAMES.status, STATUS_PARAM[state.status]);
  if (state.duration) params.set(PARAM_NAMES.duration, DURATION_PARAM[state.duration]);
  if (state.sort && state.sort !== defaultSort(query)) {
    params.set(PARAM_NAMES.sort, SORT_PARAM[state.sort]);
  }
  if (state.pages > 1) params.set(PARAM_NAMES.pages, String(state.pages));
  return params;
}

/** Query string for a state; commas stay readable (`genre=drama,misteri`) as in the spec. */
export function toQueryString(state: CatalogState): string {
  return serializeState(state).toString().replaceAll('%2C', ',');
}

/** Filters, facets and sorts the index for a state. */
export function runCatalog(
  entries: CatalogEntry[],
  state: CatalogState,
  ranking: SearchRanking,
): CatalogResult {
  const searched = ranking ? entries.filter((entry) => ranking.has(entry.slug)) : entries;
  const matching = searched.filter((entry) => matchesFilters(entry, state));

  return {
    entries: sortEntries(matching, effectiveSort(state), ranking),
    facets: countFacets(searched, state),
  };
}

function matchesFilters(entry: CatalogEntry, state: CatalogState, skip?: FacetGroup): boolean {
  // AND across groups; OR within the multi-select groups (genres, authors).
  return (
    (skip === 'category' || !state.category || entry.category === state.category) &&
    (skip === 'genres' ||
      state.genres.length === 0 ||
      state.genres.some((genre) => entry.genres.includes(genre))) &&
    (skip === 'authors' ||
      state.authors.length === 0 ||
      state.authors.includes(entry.authorSlug)) &&
    (skip === 'status' || !state.status || entry.status === state.status) &&
    (skip === 'duration' || !state.duration || durationOf(entry.readingMinutes) === state.duration)
  );
}

/**
 * Each option's count applies every other active filter but not its own group,
 * so the number tells the reader what they get by picking that option.
 */
function countFacets(entries: CatalogEntry[], state: CatalogState): FacetCounts {
  const facets: FacetCounts = { category: {}, genres: {}, authors: {}, status: {}, duration: {} };
  const values: Record<FacetGroup, (entry: CatalogEntry) => string[]> = {
    category: (entry) => [entry.category],
    genres: (entry) => entry.genres,
    authors: (entry) => [entry.authorSlug],
    status: (entry) => [entry.status],
    duration: (entry) => [durationOf(entry.readingMinutes)],
  };

  for (const group of Object.keys(values) as FacetGroup[]) {
    const counts = facets[group];
    for (const entry of entries) {
      if (!matchesFilters(entry, state, group)) continue;
      for (const value of values[group](entry)) {
        counts[value] = (counts[value] ?? 0) + 1;
      }
    }
  }
  return facets;
}

const titleCollator = new Intl.Collator('id', { sensitivity: 'base', numeric: true });

function sortEntries(
  entries: CatalogEntry[],
  sort: SortOrder,
  ranking: SearchRanking,
): CatalogEntry[] {
  const byNewest = (a: CatalogEntry, b: CatalogEntry) => b.publishedAt.localeCompare(a.publishedAt);
  const compare: Record<SortOrder, (a: CatalogEntry, b: CatalogEntry) => number> = {
    relevance: (a, b) =>
      (ranking?.get(a.slug) ?? 0) - (ranking?.get(b.slug) ?? 0) || byNewest(a, b),
    newest: byNewest,
    updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt) || byNewest(a, b),
    title: (a, b) => titleCollator.compare(a.title, b.title),
    shortest: (a, b) => a.readingMinutes - b.readingMinutes || byNewest(a, b),
  };
  return [...entries].sort(compare[sort]);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
