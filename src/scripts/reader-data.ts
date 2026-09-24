import type { ReaderData } from '../lib/backup';
import { sanitizePreferences } from '../lib/preferences';
import { sanitizeProgressMap } from '../lib/reading-progress';
import { sanitizeShelf, type Shelf } from '../lib/shelf';
import { readJson, removeItem, STORAGE_KEYS, writeJson } from '../lib/storage';

export function loadShelf(): Shelf {
  return sanitizeShelf(readJson(STORAGE_KEYS.shelf));
}

/** Returns false when storage is unavailable, so callers can tell the reader. */
export function saveShelf(shelf: Shelf): boolean {
  return writeJson(STORAGE_KEYS.shelf, shelf);
}

export function loadReaderData(): ReaderData {
  return {
    preferences: sanitizePreferences(readJson(STORAGE_KEYS.preferences)),
    progress: sanitizeProgressMap(readJson(STORAGE_KEYS.progress)),
    shelf: loadShelf(),
  };
}

export function saveReaderData(data: ReaderData): boolean {
  return (
    writeJson(STORAGE_KEYS.preferences, data.preferences) &&
    writeJson(STORAGE_KEYS.progress, data.progress) &&
    saveShelf(data.shelf)
  );
}

export function clearReadingHistory(): void {
  removeItem(STORAGE_KEYS.progress);
}
