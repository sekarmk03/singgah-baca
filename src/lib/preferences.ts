/** Reader preferences: theme and typography, persisted under `singgah-baca:v1:prefs`. */

export const THEMES = ['paper', 'sepia', 'night'] as const;
export type ThemeName = (typeof THEMES)[number];

export interface ReaderPreferences {
  theme?: ThemeName;
  /** Font size in px. */
  size?: number;
  /** Unitless line height. */
  leading?: number;
  /** Column width in em. */
  measure?: number;
  /** `false` forces left alignment; `undefined` justifies when hyphenation is supported. */
  justify?: boolean;
}

export type NumericPreference = 'size' | 'leading' | 'measure';

export interface Range {
  min: number;
  max: number;
  step: number;
}

export const PREFERENCE_LIMITS: Record<NumericPreference, Range> = {
  size: { min: 15, max: 26, step: 1 },
  leading: { min: 1.5, max: 2.1, step: 0.05 },
  measure: { min: 26, max: 42, step: 2 },
};

/** Defaults mirror the CSS tokens; the font size default differs between mobile and desktop. */
export const PREFERENCE_DEFAULTS = {
  sizeMobile: 18,
  sizeDesktop: 19,
  leading: 1.75,
  measure: 34,
} as const;

/** CSS custom property driven by each numeric preference. */
export const PREFERENCE_CSS_VARIABLES: Record<NumericPreference, string> = {
  size: '--reader-font-size',
  leading: '--reader-leading',
  measure: '--reader-measure',
};

export const PREFERENCE_CSS_UNITS: Record<NumericPreference, string> = {
  size: 'px',
  leading: '',
  measure: 'em',
};

/** Snaps a value onto its range and step, avoiding floating point noise like 1.7500000001. */
export function snapToRange(value: number, { min, max, step }: Range): number {
  const clamped = Math.min(max, Math.max(min, value));
  const snapped = min + Math.round((clamped - min) / step) * step;
  return Number(snapped.toFixed(2));
}

/** Keeps only valid fields from untrusted stored data. */
export function sanitizePreferences(raw: unknown): ReaderPreferences {
  if (typeof raw !== 'object' || raw === null) return {};
  const input = raw as Record<string, unknown>;
  const result: ReaderPreferences = {};

  if (THEMES.includes(input.theme as ThemeName)) {
    result.theme = input.theme as ThemeName;
  }
  for (const key of Object.keys(PREFERENCE_LIMITS) as NumericPreference[]) {
    const value = input[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = snapToRange(value, PREFERENCE_LIMITS[key]);
    }
  }
  if (typeof input.justify === 'boolean') {
    result.justify = input.justify;
  }
  return result;
}

/** Moves a numeric preference one step up or down from its current effective value. */
export function stepPreference(
  preferences: ReaderPreferences,
  key: NumericPreference,
  direction: 1 | -1,
  currentValue: number,
): ReaderPreferences {
  const range = PREFERENCE_LIMITS[key];
  return { ...preferences, [key]: snapToRange(currentValue + direction * range.step, range) };
}

export function canStep(key: NumericPreference, direction: 1 | -1, currentValue: number): boolean {
  const { min, max } = PREFERENCE_LIMITS[key];
  return direction === 1 ? currentValue < max : currentValue > min;
}

/** Whether text should be justified on wide screens. */
export function shouldJustify(preferences: ReaderPreferences, hyphenationSupported: boolean) {
  return preferences.justify ?? hyphenationSupported;
}
