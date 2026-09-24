import { describe, expect, it } from 'vitest';
import {
  canStep,
  sanitizePreferences,
  shouldJustify,
  snapToRange,
  stepPreference,
} from './preferences';

describe('snapToRange', () => {
  it('clamps and snaps to the step', () => {
    expect(snapToRange(30, { min: 15, max: 26, step: 1 })).toBe(26);
    expect(snapToRange(1.77, { min: 1.5, max: 2.1, step: 0.05 })).toBe(1.75);
    expect(snapToRange(33, { min: 26, max: 42, step: 2 })).toBe(34);
  });
});

describe('sanitizePreferences', () => {
  it('keeps valid fields and clamps numbers', () => {
    expect(
      sanitizePreferences({ theme: 'sepia', size: 99, leading: 1.75, measure: 34, justify: false }),
    ).toEqual({ theme: 'sepia', size: 26, leading: 1.75, measure: 34, justify: false });
  });

  it('drops unknown themes, non-numbers and garbage', () => {
    expect(sanitizePreferences({ theme: 'neon', size: '20', justify: 'yes' })).toEqual({});
    expect(sanitizePreferences(null)).toEqual({});
    expect(sanitizePreferences('text')).toEqual({});
  });
});

describe('stepPreference', () => {
  it('moves one step from the current value and stops at the limits', () => {
    expect(stepPreference({}, 'size', 1, 18)).toEqual({ size: 19 });
    expect(stepPreference({ theme: 'night' }, 'size', 1, 26)).toEqual({ theme: 'night', size: 26 });
    expect(stepPreference({}, 'leading', -1, 1.75)).toEqual({ leading: 1.7 });
  });

  it('reports whether another step is possible', () => {
    expect(canStep('size', 1, 26)).toBe(false);
    expect(canStep('size', -1, 26)).toBe(true);
    expect(canStep('measure', -1, 26)).toBe(false);
  });
});

describe('shouldJustify', () => {
  it('follows hyphenation support unless the reader chose', () => {
    expect(shouldJustify({}, true)).toBe(true);
    expect(shouldJustify({}, false)).toBe(false);
    expect(shouldJustify({ justify: false }, true)).toBe(false);
    expect(shouldJustify({ justify: true }, false)).toBe(true);
  });
});
