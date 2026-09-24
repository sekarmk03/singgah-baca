/**
 * localStorage access that never throws. Storage can be missing or blocked
 * (private modes, disabled site data), and the site must keep working without it.
 */

export const STORAGE_PREFIX = 'singgah-baca:v1:';

export const STORAGE_KEYS = {
  preferences: `${STORAGE_PREFIX}prefs`,
  progress: `${STORAGE_PREFIX}progress`,
  shelf: `${STORAGE_PREFIX}shelf`,
} as const;

export function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}
