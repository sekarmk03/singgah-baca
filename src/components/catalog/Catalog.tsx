import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { genreSlugs } from '../../data/genres';
import {
  formatChapterPosition,
  formatFilterButton,
  formatOptionCount,
  formatShowResults,
  formatStoryCount,
  t,
} from '../../i18n/id';
import {
  activeFilterCount,
  EMPTY_STATE,
  effectiveSort,
  PAGE_SIZE,
  parseState,
  runCatalog,
  toQueryString,
  type CatalogEntry,
  type CatalogState,
  type FacetCounts,
} from '../../lib/catalog';
import type { StoryCategory } from '../../lib/chapters';
import { recentReading } from '../../lib/continue-reading';
import type { ProgressMap } from '../../lib/reading-progress';
import { createSearch } from '../../lib/search';
import type { SortOrder } from '../../lib/url-params';
import { attachSwipeToClose, closeOnBackdropClick } from '../../scripts/bottom-sheet';
import { readProgressMap } from '../../scripts/reader/progress';
import './catalog.css';
import { FilterPanel, type Option } from './FilterPanel';
import { StoryCard } from './StoryCard';

interface Props {
  /** First page in default order, rendered at build time. */
  initialEntries: CatalogEntry[];
  initialFacets: FacetCounts;
  initialTotal: number;
  genres: Option[];
  authors: Option[];
}

interface SearchIndex {
  entries: CatalogEntry[];
  search: ReturnType<typeof createSearch>;
}

const QUERY_DEBOUNCE_MS = 150;
const SCROLL_SAVE_DEBOUNCE_MS = 300;
const DESKTOP_QUERY = '(min-width: 960px)';
const CATEGORIES: StoryCategory[] = ['short-story', 'novel'];
const SORTS: SortOrder[] = ['relevance', 'newest', 'updated', 'title', 'shortest'];

export default function Catalog(props: Props) {
  const [state, setState] = useState<CatalogState>(EMPTY_STATE);
  const [initialized, setInitialized] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // Matches the server render (sidebar) until the real width is known.
  const [isDesktop, setIsDesktop] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [progress, setProgress] = useState<ProgressMap>({});

  const dialogRef = useRef<HTMLDialogElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRestored = useRef(false);
  const focusIndexAfterLoad = useRef<number | null>(null);

  // Read the URL, storage and viewport, then load the full index.
  useEffect(() => {
    history.scrollRestoration = 'manual';
    const applyUrl = () => {
      const parsed = parseState(new URLSearchParams(location.search), genreSlugs);
      setState(parsed);
      setQueryInput(parsed.query);
    };
    applyUrl();
    // Anything typed before the page became interactive wins over the URL.
    const typed = searchRef.current?.value ?? '';
    if (typed) setQueryInput(typed);
    setInitialized(true);
    setProgress(readProgressMap());

    const media = window.matchMedia(DESKTOP_QUERY);
    const onMedia = () => setIsDesktop(media.matches);
    onMedia();
    media.addEventListener('change', onMedia);

    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((entries: CatalogEntry[]) => setIndex({ entries, search: createSearch(entries) }))
      .catch(() => setLoadFailed(true));

    let scrollTimer = 0;
    const onScroll = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
      }, SCROLL_SAVE_DEBOUNCE_MS);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', applyUrl);
    return () => {
      media.removeEventListener('change', onMedia);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', applyUrl);
    };
  }, []);

  // Typing updates the results after a short pause.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState((current) =>
        current.query === queryInput ? current : { ...current, query: queryInput, pages: 1 },
      );
    }, QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  // Keep the URL (shareable, Back-friendly) and search-engine hints in sync with the state.
  useEffect(() => {
    if (!initialized) return;
    const params = toQueryString(state);
    const url = params ? `/?${params}` : '/';
    if (url !== location.pathname + location.search) {
      history.replaceState(history.state, '', url);
    }
    updateSearchEngineHints(state, params !== '');
  }, [state, initialized]);

  const result = useMemo(
    () => (index ? runCatalog(index.entries, state, index.search(state.query)) : null),
    [index, state],
  );
  const entries = result?.entries ?? props.initialEntries;
  const total = result ? result.entries.length : props.initialTotal;
  const facets = result?.facets ?? props.initialFacets;
  const visible = entries.slice(0, state.pages * PAGE_SIZE);
  const filterCount = activeFilterCount(state);
  const recent = index ? recentReading(progress, index.entries) : [];
  const busy = !index && !loadFailed && (filterCount > 0 || state.query !== '' || state.pages > 1);

  // Returning with Back: put the reader where they left the list.
  useEffect(() => {
    if (!result || scrollRestored.current) return;
    scrollRestored.current = true;
    const scrollY = (history.state as { scrollY?: unknown } | null)?.scrollY;
    if (typeof scrollY === 'number') requestAnimationFrame(() => window.scrollTo(0, scrollY));
  }, [result]);

  // After "Muat lebih banyak", move keyboard focus to the first new story.
  useEffect(() => {
    const focusIndex = focusIndexAfterLoad.current;
    if (focusIndex === null) return;
    focusIndexAfterLoad.current = null;
    const links = listRef.current?.querySelectorAll<HTMLAnchorElement>('.story-card__title a');
    links?.[focusIndex]?.focus();
  }, [state.pages]);

  // The mobile filter sheet is a native modal dialog: focus trap, Esc and inert background.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (sheetOpen && !isDesktop && !dialog.open) dialog.showModal();
    if ((!sheetOpen || isDesktop) && dialog.open) dialog.close();
  }, [sheetOpen, isDesktop]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const detachBackdrop = closeOnBackdropClick(dialog);
    const detachSwipe = attachSwipeToClose(
      dialog,
      dialog.querySelector<HTMLElement>('.filter-sheet__head')!,
      dialog.querySelector<HTMLElement>('.filter-sheet__body')!,
    );
    return () => {
      detachBackdrop();
      detachSwipe();
    };
  }, [isDesktop]);

  const update = (patch: Partial<CatalogState>) =>
    setState((current) => ({ ...current, ...patch, pages: 1 }));
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  const clearFilters = () =>
    setState((current) => ({ ...EMPTY_STATE, query: current.query, sort: current.sort }));

  const genreName = (slug: string) =>
    props.genres.find((genre) => genre.slug === slug)?.name ?? slug;
  const authorName = (slug: string) =>
    props.authors.find((author) => author.slug === slug)?.name ?? slug;

  const activeChips = [
    ...(state.category
      ? [{ label: t.category[state.category], remove: () => update({ category: undefined }) }]
      : []),
    ...state.genres.map((slug) => ({
      label: genreName(slug),
      remove: () => update({ genres: state.genres.filter((genre) => genre !== slug) }),
    })),
    ...state.authors.map((slug) => ({
      label: authorName(slug),
      remove: () => update({ authors: state.authors.filter((author) => author !== slug) }),
    })),
    ...(state.status
      ? [{ label: t.status[state.status], remove: () => update({ status: undefined }) }]
      : []),
    ...(state.duration
      ? [
          {
            label: t.catalog.durations[state.duration],
            remove: () => update({ duration: undefined }),
          },
        ]
      : []),
  ];

  const progressLabel = (entry: CatalogEntry) => {
    const saved = progress[entry.slug];
    if (!saved) return undefined;
    return entry.category === 'novel' && saved.order
      ? formatChapterPosition(saved.order, entry.chapterCount)
      : t.catalog.readingNow;
  };

  const panel = (
    <FilterPanel
      state={state}
      facets={facets}
      genres={props.genres}
      authors={props.authors}
      onToggleGenre={(slug) => update({ genres: toggle(state.genres, slug) })}
      onToggleAuthor={(slug) => update({ authors: toggle(state.authors, slug) })}
      onStatus={(status) => update({ status })}
      onDuration={(duration) => update({ duration })}
    />
  );

  return (
    <div class="catalog">
      <div class="catalog__search">
        <label class="visually-hidden" for="catalog-search">
          {t.catalog.searchLabel}
        </label>
        <input
          ref={searchRef}
          id="catalog-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder={t.catalog.searchPlaceholder}
          value={queryInput}
          onInput={(event) => setQueryInput(event.currentTarget.value)}
        />
      </div>

      <div class="continue-slot">
        {recent.length > 0 && (
          <section class="continue ui" aria-labelledby="continue-heading">
            <h2 id="continue-heading">{t.catalog.continueReading}</h2>
            <ul>
              {recent.map(({ entry, url }) => (
                <li key={entry.slug}>
                  <a href={url}>
                    <span class="continue__title">{entry.title}</span>
                    <span class="continue__position muted">{progressLabel(entry)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div class="catalog__layout">
        {isDesktop && (
          <aside class="catalog__sidebar" aria-label={t.catalog.filters}>
            {panel}
          </aside>
        )}

        <div class="catalog__main">
          <div class="catalog__toolbar ui">
            <div class="catalog__categories" role="group" aria-label={t.catalog.category}>
              <button
                type="button"
                class="chip"
                aria-pressed={!state.category}
                onClick={() => update({ category: undefined })}
              >
                {t.catalog.all}
              </button>
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  class={`chip${!facets.category[category] && state.category !== category ? ' is-empty' : ''}`}
                  aria-pressed={state.category === category}
                  onClick={() => update({ category })}
                >
                  {formatOptionCount(t.category[category], facets.category[category] ?? 0)}
                </button>
              ))}
            </div>

            <div class="catalog__controls">
              <button
                ref={filterButtonRef}
                type="button"
                class="catalog__filter-button"
                aria-haspopup="dialog"
                onClick={() => setSheetOpen(true)}
              >
                {formatFilterButton(filterCount)}
              </button>
              <label class="catalog__sort">
                <span>{t.catalog.sort}</span>
                <select
                  value={effectiveSort(state)}
                  onChange={(event) => update({ sort: event.currentTarget.value as SortOrder })}
                >
                  {SORTS.filter((sort) => sort !== 'relevance' || state.query.trim()).map(
                    (sort) => (
                      <option key={sort} value={sort}>
                        {t.catalog.sorts[sort]}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div class="catalog__active ui" role="group" aria-label={t.catalog.activeFilters}>
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  class="chip chip--removable"
                  aria-label={`${t.catalog.removeFilter} ${chip.label}`}
                  onClick={chip.remove}
                >
                  {chip.label} <span aria-hidden="true">×</span>
                </button>
              ))}
              <button type="button" class="text-button" onClick={clearFilters}>
                {t.catalog.clearAll}
              </button>
            </div>
          )}

          <p class="catalog__count ui muted" aria-live="polite">
            {loadFailed ? t.catalog.loadError : formatStoryCount(total)}
          </p>

          {total === 0 && result ? (
            <div class="catalog__empty">
              <p>{t.catalog.noResults}</p>
              {filterCount > 0 && (
                <button type="button" class="button ui" onClick={clearFilters}>
                  {t.catalog.clearAll}
                </button>
              )}
            </div>
          ) : (
            <div
              ref={listRef}
              class="catalog__grid story-grid story-grid--wide"
              aria-label={t.catalog.results}
              aria-busy={busy}
              role="region"
            >
              {visible.map((entry) => (
                <StoryCard key={entry.slug} entry={entry} progressLabel={progressLabel(entry)} />
              ))}
            </div>
          )}

          {visible.length < total && (
            <button
              type="button"
              class="button button--secondary ui catalog__more"
              onClick={() => {
                focusIndexAfterLoad.current = visible.length;
                setState((current) => ({ ...current, pages: current.pages + 1 }));
              }}
            >
              {t.catalog.loadMore}
            </button>
          )}
        </div>
      </div>

      {!isDesktop && (
        <dialog
          ref={dialogRef}
          class="filter-sheet"
          aria-labelledby="filter-sheet-title"
          onClose={() => {
            setSheetOpen(false);
            filterButtonRef.current?.focus();
          }}
        >
          <div class="filter-sheet__body">
            <div class="filter-sheet__head ui">
              <div class="filter-sheet__handle" aria-hidden="true" />
              <h2 id="filter-sheet-title">{t.catalog.filters}</h2>
              <button type="button" class="text-button" onClick={() => setSheetOpen(false)}>
                {t.catalog.closeFilters}
              </button>
            </div>
            {panel}
            <div class="filter-sheet__footer ui">
              {filterCount > 0 && (
                <button type="button" class="text-button" onClick={clearFilters}>
                  {t.catalog.clearAll}
                </button>
              )}
              <button type="button" class="button" onClick={() => setSheetOpen(false)}>
                {formatShowResults(total)}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

/**
 * Filtered views are not separate pages for search engines: they get `noindex`, and a view of a
 * single genre points to that genre's own page.
 */
function updateSearchEngineHints(state: CatalogState, filtered: boolean): void {
  let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (filtered) {
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = 'noindex';
  } else {
    robots?.remove();
  }

  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) {
    const onlyOneGenre =
      state.genres.length === 1 && activeFilterCount(state) === 1 && !state.query.trim();
    canonical.href = new URL(
      onlyOneGenre ? `/genre/${state.genres[0]}` : '/',
      location.origin,
    ).href;
  }
}
