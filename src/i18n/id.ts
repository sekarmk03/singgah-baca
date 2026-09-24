/**
 * Every user-facing string lives here: English keys, Indonesian values.
 * Components must not hard-code UI text.
 */

import type { StoryCategory } from '../lib/chapters';
import type { ThemeName } from '../lib/preferences';

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
    continue: 'Lanjutkan membaca',
    lastRead: 'Terakhir dibaca:',
  },
  reader: {
    backToStory: 'Kembali ke detail cerita',
    chapterPicker: 'Pilih bab',
    settings: 'Pengaturan baca',
    progress: 'Progres membaca bab ini',
    previous: 'Bab sebelumnya',
    next: 'Bab berikutnya',
    chapterNav: 'Navigasi bab',
  },
  settings: {
    title: 'Pengaturan baca',
    theme: 'Tema',
    themeAuto: 'Otomatis',
    themes: {
      paper: 'Kertas',
      sepia: 'Sepia',
      night: 'Malam',
    } satisfies Record<ThemeName, string>,
    fontSize: 'Ukuran huruf',
    fontSizeDecrease: 'Perkecil huruf',
    fontSizeIncrease: 'Perbesar huruf',
    lineHeight: 'Jarak baris',
    lineHeightDecrease: 'Rapatkan jarak baris',
    lineHeightIncrease: 'Renggangkan jarak baris',
    measure: 'Lebar kolom',
    measureDecrease: 'Persempit kolom',
    measureIncrease: 'Perlebar kolom',
    justify: 'Rata kiri-kanan',
    justifyHint: 'Berlaku di layar selebar 520 px ke atas.',
    reset: 'Atur ulang',
    close: 'Tutup',
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

/** "19 px" */
export function formatFontSize(px: number): string {
  return `${formatNumber(px)} px`;
}

/** "1,75" */
export function formatLineHeight(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Average Literata characters per em at body size, used for the column width label. */
const CHARACTERS_PER_EM = 1.9;

/** Column width in em as an approximate character count: "± 65 karakter" */
export function formatMeasure(em: number): string {
  return `± ${formatNumber(Math.round(em * CHARACTERS_PER_EM))} karakter`;
}
