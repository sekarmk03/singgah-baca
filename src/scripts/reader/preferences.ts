import {
  PREFERENCE_CSS_UNITS,
  PREFERENCE_CSS_VARIABLES,
  sanitizePreferences,
  shouldJustify,
  type NumericPreference,
  type ReaderPreferences,
} from '../../lib/preferences';
import { readJson, removeItem, STORAGE_KEYS, writeJson } from '../../lib/storage';

const root = document.documentElement;

export function loadPreferences(): ReaderPreferences {
  return sanitizePreferences(readJson(STORAGE_KEYS.preferences));
}

export function savePreferences(preferences: ReaderPreferences): void {
  if (Object.keys(preferences).length === 0) {
    removeItem(STORAGE_KEYS.preferences);
  } else {
    writeJson(STORAGE_KEYS.preferences, preferences);
  }
}

/** Mirrors the inline boot script in PreferencesBoot.astro. */
export function applyPreferences(preferences: ReaderPreferences): void {
  if (preferences.theme) {
    root.dataset.theme = preferences.theme;
  } else {
    delete root.dataset.theme;
  }

  for (const key of Object.keys(PREFERENCE_CSS_VARIABLES) as NumericPreference[]) {
    const value = preferences[key];
    if (value === undefined) {
      root.style.removeProperty(PREFERENCE_CSS_VARIABLES[key]);
    } else {
      root.style.setProperty(PREFERENCE_CSS_VARIABLES[key], `${value}${PREFERENCE_CSS_UNITS[key]}`);
    }
  }

  root.dataset.justify = String(shouldJustify(preferences, isHyphenationSupported()));
}

/** The value currently in effect, including CSS defaults that differ per breakpoint. */
export function currentValue(key: NumericPreference): number {
  return parseFloat(getComputedStyle(root).getPropertyValue(PREFERENCE_CSS_VARIABLES[key]));
}

export function isHyphenationSupported(): boolean {
  return root.dataset.hyphenation === 'supported';
}

export function isJustified(): boolean {
  return root.dataset.justify === 'true';
}
