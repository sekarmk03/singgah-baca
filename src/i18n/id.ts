/**
 * Every user-facing string lives here: English keys, Indonesian values.
 * Components must not hard-code UI text.
 */

import type { StoryCategory } from '../lib/chapters';
import type { ThemeName } from '../lib/preferences';
import type { Duration, SortOrder, StoryStatus } from '../lib/url-params';

export const siteName = 'Singgah Baca';

export const t = {
  site: {
    name: siteName,
    description:
      'Perpustakaan cerpen dan novel berbahasa Indonesia yang nyaman dibaca di layar mana pun.',
    skipToContent: 'Lompat ke isi',
    mainNav: 'Navigasi utama',
    shelf: 'Rak saya',
  },
  catalog: {
    heading: 'Semua cerita',
    empty: 'Belum ada cerita yang terbit.',
    searchLabel: 'Cari judul, penulis, atau kata kunci',
    searchPlaceholder: 'Cari cerita…',
    filters: 'Filter',
    all: 'Semua',
    category: 'Kategori',
    genre: 'Genre',
    author: 'Penulis',
    authorSearch: 'Cari penulis',
    status: 'Status',
    duration: 'Durasi baca',
    durations: {
      short: '< 10 menit',
      medium: '10–60 menit',
      long: '> 60 menit',
    } satisfies Record<Duration, string>,
    sort: 'Urutkan',
    sorts: {
      relevance: 'Paling relevan',
      newest: 'Terbaru',
      updated: 'Baru diperbarui',
      title: 'Judul A–Z',
      shortest: 'Terpendek',
    } satisfies Record<SortOrder, string>,
    activeFilters: 'Filter aktif',
    clearAll: 'Hapus semua filter',
    removeFilter: 'Hapus filter',
    noResults: 'Tidak ada cerita yang cocok. Coba kurangi filter atau ubah kata kunci.',
    loadMore: 'Muat lebih banyak',
    loadError: 'Pencarian belum bisa dimuat. Periksa koneksi, lalu muat ulang halaman.',
    closeFilters: 'Tutup',
    continueReading: 'Lanjutkan membaca',
    readingNow: 'Sedang dibaca',
    results: 'Daftar cerita',
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
  shelf: {
    title: 'Rak saya',
    description: 'Cerita yang Anda simpan dan riwayat baca Anda di perangkat ini.',
    save: 'Simpan ke Rak',
    remove: 'Hapus dari Rak',
    savedStatus: 'Cerita disimpan di Rak.',
    removedStatus: 'Cerita dihapus dari Rak.',
    savedHeading: 'Disimpan',
    savedEmpty: 'Belum ada cerita yang disimpan. Pilih "Simpan ke Rak" di halaman cerita.',
    historyHeading: 'Riwayat baca',
    historyEmpty: 'Belum ada riwayat baca.',
    continue: 'Lanjutkan',
    dataHeading: 'Data di perangkat ini',
    dataHint:
      'Rak, riwayat baca, dan pengaturan hanya tersimpan di browser ini. Ekspor data untuk memindahkannya ke perangkat lain.',
    export: 'Ekspor data',
    import: 'Impor data',
    clearHistory: 'Hapus riwayat baca',
    clearConfirm: 'Hapus semua riwayat baca di perangkat ini? Cerita di Rak tidak ikut terhapus.',
    imported: 'Data berhasil diimpor.',
    importError: 'File tidak dapat dibaca. Pastikan file berasal dari menu Ekspor Singgah Baca.',
    historyCleared: 'Riwayat baca sudah dihapus.',
    storageUnavailable:
      'Penyimpanan browser tidak tersedia, jadi Rak dan riwayat baca tidak bisa disimpan.',
    loading: 'Memuat rak…',
  },
  genrePage: {
    refine: 'Saring lebih lanjut di katalog',
  },
  authorPage: {
    works: 'Karya',
    links: 'Tautan',
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

/** "12 cerita" */
export function formatStoryCount(count: number): string {
  return `${formatNumber(count)} cerita`;
}

/** "Filter (3)" */
export function formatFilterButton(activeCount: number): string {
  return activeCount > 0
    ? `${t.catalog.filters} (${formatNumber(activeCount)})`
    : t.catalog.filters;
}

/** "Tampilkan 24 cerita" */
export function formatShowResults(count: number): string {
  return `Tampilkan ${formatStoryCount(count)}`;
}

/** "Misteri (12)" */
export function formatOptionCount(label: string, count: number): string {
  return `${label} (${formatNumber(count)})`;
}

/** "Genre Drama" */
export function formatGenreTitle(name: string): string {
  return `Genre ${name}`;
}

/** "Cerpen dan novel bergenre drama di Singgah Baca." */
export function formatGenreDescription(name: string): string {
  return `Cerpen dan novel bergenre ${name.toLocaleLowerCase('id')} di ${siteName}.`;
}

/** "Cerita karya Laras Wening di Singgah Baca." */
export function formatAuthorDescription(name: string): string {
  return `Cerita karya ${name} di ${siteName}.`;
}

/** "Terakhir dibaca 24 September 2026" */
export function formatLastRead(date: Date): string {
  return `Terakhir dibaca ${formatDate(date)}`;
}
