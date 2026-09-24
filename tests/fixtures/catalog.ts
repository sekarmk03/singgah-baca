import type { CatalogEntry } from '../../src/lib/catalog';

const GENRES = ['drama', 'romansa', 'misteri', 'keluarga', 'fantasi', 'horor', 'komedi', 'sejarah'];
const WORDS = [
  'hujan',
  'kereta',
  'surat',
  'rumah',
  'malam',
  'laut',
  'kota',
  'bulan',
  'jalan',
  'ibu',
];

/** Deterministic dummy index for performance and browser tests. */
export function dummyEntries(count: number): CatalogEntry[] {
  return Array.from({ length: count }, (_, index) => {
    const word = (offset: number) => WORDS[(index * 7 + offset) % WORDS.length];
    const day = String((index % 28) + 1).padStart(2, '0');
    const month = String((index % 12) + 1).padStart(2, '0');
    const isNovel = index % 3 !== 0;
    return {
      slug: `cerita-${index}`,
      title: `${capitalize(word(0))} di ${capitalize(word(3))} ${index}`,
      authorName: `Penulis ${index % 40}`,
      authorSlug: `penulis-${index % 40}`,
      category: isNovel ? 'novel' : 'short-story',
      genres: [GENRES[index % GENRES.length], GENRES[(index * 3 + 1) % GENRES.length]],
      tags: [word(1), word(2)],
      status: index % 4 === 0 ? 'ongoing' : 'completed',
      synopsis: `Sinopsis cerita nomor ${index} tentang ${word(4)} dan ${word(5)}.`,
      chapterCount: isNovel ? (index % 30) + 2 : 1,
      readingMinutes: isNovel ? (index % 200) + 11 : (index % 9) + 1,
      publishedAt: `20${20 + (index % 6)}-${month}-${day}T00:00:00.000Z`,
      updatedAt: `2026-${month}-${day}T00:00:00.000Z`,
    };
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
