import { describe, expect, it } from 'vitest';
import {
  backupFileName,
  createBackup,
  mergeReaderData,
  parseBackup,
  type ReaderData,
} from './backup';
import { sanitizeShelf, toggleShelf } from './shelf';

const now = new Date('2026-09-24T10:00:00Z');
const entry = (chapter: string, at: string) => ({ chapter, paragraph: 1, offset: 0.5, at });

describe('shelf', () => {
  it('keeps unique valid slugs', () => {
    expect(sanitizeShelf(['a', 'a', 'B', 3, 'cerita-1'])).toEqual(['a', 'cerita-1']);
    expect(sanitizeShelf('a')).toEqual([]);
  });

  it('toggles a story, newest first', () => {
    expect(toggleShelf(['a'], 'b')).toEqual(['b', 'a']);
    expect(toggleShelf(['b', 'a'], 'b')).toEqual(['a']);
  });
});

describe('backup', () => {
  const data: ReaderData = {
    preferences: { theme: 'night', size: 20 },
    progress: { hujan: entry('bab-1', '2026-09-20T00:00:00Z') },
    shelf: ['hujan'],
  };

  it('round-trips through JSON', () => {
    const text = JSON.stringify(createBackup(data, now));
    expect(parseBackup(text)).toEqual(data);
  });

  it('rejects files that are not Singgah Baca backups', () => {
    expect(parseBackup('bukan json')).toBeNull();
    expect(parseBackup('[]')).toBeNull();
    expect(parseBackup(JSON.stringify({ ...createBackup(data, now), app: 'lain' }))).toBeNull();
    expect(parseBackup(JSON.stringify({ ...createBackup(data, now), version: 2 }))).toBeNull();
  });

  it('drops invalid fields inside a valid backup', () => {
    const text = JSON.stringify({
      app: 'singgah-baca',
      version: 1,
      preferences: { theme: 'neon', size: 99 },
      progress: { hujan: { chapter: 1 } },
      shelf: ['ok', '<script>'],
    });
    expect(parseBackup(text)).toEqual({ preferences: { size: 26 }, progress: {}, shelf: ['ok'] });
  });

  it('merges: newest progress wins, shelves join, imported preferences override', () => {
    const merged = mergeReaderData(data, {
      preferences: { size: 22 },
      progress: {
        hujan: entry('bab-2', '2026-09-21T00:00:00Z'),
        surat: entry('baca', '2026-09-01T00:00:00Z'),
      },
      shelf: ['surat', 'hujan'],
    });
    expect(merged.preferences).toEqual({ theme: 'night', size: 22 });
    expect(merged.progress.hujan.chapter).toBe('bab-2');
    expect(Object.keys(merged.progress)).toEqual(['hujan', 'surat']);
    expect(merged.shelf).toEqual(['hujan', 'surat']);

    const older = mergeReaderData(data, {
      ...data,
      progress: { hujan: entry('bab-0', '2026-01-01T00:00:00Z') },
    });
    expect(older.progress.hujan.chapter).toBe('bab-1');
  });

  it('names the file with the date', () => {
    expect(backupFileName(now)).toBe('singgah-baca-2026-09-24.json');
  });
});
