/**
 * Every user-facing string lives here: English keys, Indonesian values.
 * Components must not hard-code UI text.
 */

import type { StoryCategory } from '../lib/chapters';

export type StoryStatus = 'completed' | 'ongoing';

export const siteName = 'Singgah Baca';

export const t = {
  site: {
    name: siteName,
    description:
      'Perpustakaan cerpen dan novel berbahasa Indonesia yang nyaman dibaca di layar mana pun.',
    skipToContent: 'Lompat ke isi',
  },
  catalog: {
    heading: 'Semua cerita',
    empty: 'Belum ada cerita yang terbit.',
  },
  story: {
    by: 'oleh',
    chapters: 'Daftar bab',
    start: 'Mulai membaca',
  },
  reader: {
    previous: 'Bab sebelumnya',
    next: 'Bab berikutnya',
    chapterNav: 'Navigasi bab',
  },
  notFound: {
    title: 'Halaman tidak ditemukan',
    message: 'Halaman yang Anda cari tidak ada atau sudah dipindahkan.',
    backToCatalog: 'Kembali ke katalog',
  },
  category: {
    'short-story': 'Cerpen',
    novel: 'Novel',
  } satisfies Record<StoryCategory, string>,
  status: {
    completed: 'Tamat',
    ongoing: 'Bersambung',
  } satisfies Record<StoryStatus, string>,
} as const;

const LOCALE = 'id-ID';

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});
const numberFormatter = new Intl.NumberFormat(LOCALE);

/** "24 September 2026" */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** "1.000" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** "sekitar 9 menit" */
export function formatReadingTime(minutes: number): string {
  return `sekitar ${formatNumber(minutes)} menit`;
}

/** "12 bab" */
export function formatChapterCount(count: number): string {
  return `${formatNumber(count)} bab`;
}

/** "Bab 2 dari 12" */
export function formatChapterPosition(order: number, total: number): string {
  return `Bab ${formatNumber(order)} dari ${formatNumber(total)}`;
}
