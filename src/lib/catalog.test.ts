import { describe, expect, it } from 'vitest';
import { dummyEntries } from '../../tests/fixtures/catalog';
import {
  activeFilterCount,
  durationOf,
  effectiveSort,
  EMPTY_STATE,
  parseState,
  runCatalog,
  serializeState,
  toQueryString,
  type CatalogEntry,
  type CatalogState,
} from './catalog';
import { createSearch } from './search';

const GENRES = ['drama', 'romansa', 'misteri', 'keluarga', 'fantasi', 'horor', 'komedi', 'sejarah'];

function entry(overrides: Partial<CatalogEntry>): CatalogEntry {
  return {
    slug: 'cerita',
    title: 'Cerita',
    authorName: 'Laras Wening',
    authorSlug: 'laras-wening',
    category: 'novel',
    genres: ['drama'],
    tags: [],
    status: 'completed',
    synopsis: '',
    chapterCount: 3,
    readingMinutes: 30,
    publishedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const state = (overrides: Partial<CatalogState>): CatalogState => ({
  ...EMPTY_STATE,
  ...overrides,
});

describe('URL state', () => {
  it('parses the example URL from the spec', () => {
    const parsed = parseState(
      new URLSearchParams('q=hujan&kategori=novel&genre=drama,misteri&urut=terbaru'),
      GENRES,
    );
    expect(parsed).toEqual({
      query: 'hujan',
      category: 'novel',
      genres: ['drama', 'misteri'],
      authors: [],
      status: undefined,
      duration: undefined,
      sort: 'newest',
      pages: 1,
    });
  });

  it('drops unknown values instead of failing', () => {
    const parsed = parseState(
      new URLSearchParams('kategori=komik&genre=drama,aksi,,DRAMA&status=x&urut=acak&hal=-3'),
      GENRES,
    );
    expect(parsed).toEqual({ ...EMPTY_STATE, genres: ['drama'] });
  });

  it('round-trips every filter', () => {
    const original = state({
      query: 'hujan',
      category: 'short-story',
      genres: ['drama', 'misteri'],
      authors: ['laras-wening'],
      status: 'ongoing',
      duration: 'long',
      sort: 'title',
      pages: 3,
    });
    const params = serializeState(original);
    expect(params.toString()).toBe(
      'q=hujan&kategori=cerpen&genre=drama%2Cmisteri&penulis=laras-wening&status=bersambung&durasi=panjang&urut=judul&hal=3',
    );
    expect(parseState(params, GENRES)).toEqual(original);
  });

  it('keeps commas readable in the query string', () => {
    expect(toQueryString(state({ genres: ['drama', 'misteri'] }))).toBe('genre=drama,misteri');
  });

  it('leaves default values out of the URL', () => {
    expect(serializeState(EMPTY_STATE).toString()).toBe('');
    expect(serializeState(state({ sort: 'newest' })).toString()).toBe('');
    expect(serializeState(state({ query: 'x', sort: 'relevance' })).toString()).toBe('q=x');
    expect(serializeState(state({ query: 'x', sort: 'newest' })).toString()).toBe(
      'q=x&urut=terbaru',
    );
  });
});

describe('sorting defaults', () => {
  it('is newest without a query and relevance with one', () => {
    expect(effectiveSort(EMPTY_STATE)).toBe('newest');
    expect(effectiveSort(state({ query: 'hujan' }))).toBe('relevance');
    expect(effectiveSort(state({ sort: 'relevance' }))).toBe('newest');
  });
});

describe('durationOf', () => {
  it('uses the spec buckets', () => {
    expect(durationOf(9)).toBe('short');
    expect(durationOf(10)).toBe('medium');
    expect(durationOf(60)).toBe('medium');
    expect(durationOf(61)).toBe('long');
  });
});

describe('runCatalog', () => {
  const entries = [
    entry({ slug: 'a', title: 'Anggrek', genres: ['drama'], publishedAt: '2026-03-01' }),
    entry({
      slug: 'b',
      title: 'Bulan',
      genres: ['misteri'],
      category: 'short-story',
      readingMinutes: 5,
      publishedAt: '2026-02-01',
    }),
    entry({
      slug: 'c',
      title: 'Cahaya',
      genres: ['drama', 'misteri'],
      status: 'ongoing',
      authorSlug: 'bayu',
      publishedAt: '2026-01-01',
    }),
  ];

  it('ORs genres and ANDs groups', () => {
    const result = runCatalog(
      entries,
      state({ genres: ['drama', 'misteri'], category: 'novel' }),
      undefined,
    );
    expect(result.entries.map((e) => e.slug)).toEqual(['a', 'c']);
  });

  it('counts each option with the other groups applied but not its own', () => {
    const { facets } = runCatalog(
      entries,
      state({ category: 'novel', genres: ['drama'] }),
      undefined,
    );
    // Genre counts ignore the genre selection but respect category = novel.
    expect(facets.genres).toEqual({ drama: 2, misteri: 1 });
    // Category counts ignore category but respect genre = drama.
    expect(facets.category).toEqual({ novel: 2 });
    expect(facets.status).toEqual({ completed: 1, ongoing: 1 });
  });

  it('sorts by every order', () => {
    const slugs = (sort: CatalogState['sort']) =>
      runCatalog(entries, state({ sort }), undefined).entries.map((e) => e.slug);
    expect(slugs('newest')).toEqual(['a', 'b', 'c']);
    expect(slugs('title')).toEqual(['a', 'b', 'c']);
    expect(slugs('shortest')[0]).toBe('b');
  });

  it('keeps search rank order for relevance', () => {
    const ranking = new Map([
      ['c', 0],
      ['a', 1],
    ]);
    const result = runCatalog(entries, state({ query: 'x' }), ranking);
    expect(result.entries.map((e) => e.slug)).toEqual(['c', 'a']);
  });

  it('counts active filters for the Filter (N) button', () => {
    expect(activeFilterCount(state({ genres: ['a', 'b'], status: 'ongoing' }))).toBe(3);
  });
});

describe('search', () => {
  const entries = [
    entry({ slug: 'hujan', title: 'Hujan di Stasiun Terakhir', tags: ['kereta'] }),
    entry({ slug: 'surat', title: 'Surat untuk Ibu', authorName: 'Bayu Anggara' }),
    entry({ slug: 'kafe', title: 'Kafé di Ujung Jalan' }),
  ];
  const search = createSearch(entries);

  it('tolerates typos and case', () => {
    expect([...search('HUJAM')!.keys()]).toContain('hujan');
  });

  it('matches author names and tags', () => {
    expect([...search('bayu')!.keys()]).toEqual(['surat']);
    expect([...search('kereta')!.keys()]).toEqual(['hujan']);
  });

  it('ignores accents', () => {
    expect([...search('kafe')!.keys()]).toEqual(['kafe']);
  });

  it('returns undefined for an empty query', () => {
    expect(search('   ')).toBeUndefined();
  });
});

describe('performance with 1.000 stories', () => {
  it('searches, filters, facets and sorts within 50 ms', () => {
    const entries = dummyEntries(1000);
    const search = createSearch(entries);
    const busy = state({
      query: 'hujan',
      category: 'novel',
      genres: ['drama', 'misteri'],
      status: 'completed',
      sort: 'title',
    });
    runCatalog(entries, busy, search(busy.query)); // warm up the JIT

    const start = performance.now();
    const result = runCatalog(entries, busy, search(busy.query));
    const elapsed = performance.now() - start;

    expect(result.entries.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });
});
