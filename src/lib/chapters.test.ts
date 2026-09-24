import { describe, expect, it } from 'vitest';
import {
  countWords,
  deriveUpdatedAt,
  estimateReadingMinutes,
  parseChapterFileName,
  resolveChapters,
  type ChapterSource,
} from './chapters';

function chapter(fileName: string, overrides: Partial<ChapterSource> = {}): ChapterSource {
  return { fileName, title: fileName, draft: false, wordCount: 100, ...overrides };
}

describe('parseChapterFileName', () => {
  it('splits the order prefix from the slug', () => {
    expect(parseChapterFileName('01-kereta-yang-terlambat')).toEqual({
      order: 1,
      baseSlug: 'kereta-yang-terlambat',
    });
  });

  it('rejects file names without an order prefix', () => {
    expect(() => parseChapterFileName('kereta-yang-terlambat')).toThrow(/order number/);
  });
});

describe('resolveChapters', () => {
  it('sorts novel chapters by prefix and derives slugs from file names', () => {
    const result = resolveChapters('novel', 'novel', [chapter('02-dua'), chapter('01-satu')]);
    expect(result.map((c) => [c.order, c.slug])).toEqual([
      [1, 'satu'],
      [2, 'dua'],
    ]);
  });

  it('lets the frontmatter slug override the file name', () => {
    const [first] = resolveChapters('novel', 'novel', [chapter('01-baru', { slug: 'lama' })]);
    expect(first.slug).toBe('lama');
  });

  it('always uses "baca" for short stories', () => {
    const [only] = resolveChapters('cerpen', 'short-story', [chapter('01-surat-untuk-ibu')]);
    expect(only.slug).toBe('baca');
  });

  it('rejects short stories with more than one chapter', () => {
    expect(() =>
      resolveChapters('cerpen', 'short-story', [chapter('01-a'), chapter('02-b')]),
    ).toThrow(/exactly 1/);
  });

  it('rejects duplicate order numbers', () => {
    expect(() => resolveChapters('novel', 'novel', [chapter('01-a'), chapter('1-b')])).toThrow(
      /order number "1"/,
    );
  });

  it('rejects duplicate slugs', () => {
    expect(() =>
      resolveChapters('novel', 'novel', [chapter('01-a'), chapter('02-b', { slug: 'a' })]),
    ).toThrow(/slug "a"/);
  });

  it('rejects stories without chapters', () => {
    expect(() => resolveChapters('novel', 'novel', [])).toThrow(/no chapters/);
  });
});

describe('countWords', () => {
  it('ignores Markdown syntax and keeps hyphenated words whole', () => {
    expect(
      countWords('# Judul\n\n*Hujan* turun lagi, anak-anak [berlari](https://x.id).\n\n***'),
    ).toBe(6);
  });
});

describe('estimateReadingMinutes', () => {
  it('rounds up and never returns zero', () => {
    expect(estimateReadingMinutes(0)).toBe(1);
    expect(estimateReadingMinutes(201)).toBe(2);
  });
});

describe('deriveUpdatedAt', () => {
  it('returns the newest chapter date, or the story date when chapters are undated', () => {
    const story = new Date('2026-01-01');
    const newer = new Date('2026-03-01');
    expect(deriveUpdatedAt(story, [chapter('01-a', { publishedAt: newer })])).toEqual(newer);
    expect(deriveUpdatedAt(story, [chapter('01-a')])).toEqual(story);
  });
});
