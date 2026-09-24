/**
 * Export/import of everything the site stores for a reader, as a replacement for syncing
 * between devices. Imported files are untrusted and are validated field by field.
 */

import { sanitizePreferences, type ReaderPreferences } from './preferences';
import { sanitizeProgressMap, type ProgressMap } from './reading-progress';
import { sanitizeShelf, type Shelf } from './shelf';

export const BACKUP_APP = 'singgah-baca';
export const BACKUP_VERSION = 1;

export interface ReaderData {
  preferences: ReaderPreferences;
  progress: ProgressMap;
  shelf: Shelf;
}

export interface Backup extends ReaderData {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
}

export function createBackup(data: ReaderData, now: Date): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), ...data };
}

/** Returns the reader data in a backup file, or `null` when the file is not a valid backup. */
export function parseBackup(text: string): ReaderData | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const input = raw as Record<string, unknown>;
  if (input.app !== BACKUP_APP || input.version !== BACKUP_VERSION) return null;

  return {
    preferences: sanitizePreferences(input.preferences),
    progress: sanitizeProgressMap(input.progress),
    shelf: sanitizeShelf(input.shelf),
  };
}

/**
 * Combines imported data with what is already stored: the most recent progress per story wins,
 * shelves are joined, and imported preferences override current ones field by field.
 */
export function mergeReaderData(current: ReaderData, incoming: ReaderData): ReaderData {
  const progress: ProgressMap = { ...current.progress };
  for (const [story, entry] of Object.entries(incoming.progress)) {
    const existing = progress[story];
    if (!existing || entry.at > existing.at) progress[story] = entry;
  }

  return {
    preferences: { ...current.preferences, ...incoming.preferences },
    progress,
    shelf: [...new Set([...current.shelf, ...incoming.shelf])],
  };
}

/** "singgah-baca-2026-09-24.json" */
export function backupFileName(now: Date): string {
  return `${BACKUP_APP}-${now.toISOString().slice(0, 10)}.json`;
}
