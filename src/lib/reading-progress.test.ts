import { describe, expect, it } from 'vitest';
import {
  findPosition,
  sanitizeProgressMap,
  scrollDeltaFor,
  scrollFraction,
} from './reading-progress';

const blocks = [
  { top: -300, height: 200 }, // ends above the reading line
  { top: -100, height: 200 }, // crosses the reading line at 64
  { top: 100, height: 200 },
];

describe('findPosition', () => {
  it('returns the block at the reading line and the offset into it', () => {
    expect(findPosition(blocks, 64)).toEqual({ paragraph: 1, offset: 0.82 });
  });

  it('handles the top of the page and the end of the chapter', () => {
    expect(findPosition([{ top: 100, height: 50 }], 64)).toEqual({ paragraph: 0, offset: 0 });
    expect(findPosition([{ top: -500, height: 50 }], 64)).toEqual({ paragraph: 0, offset: 1 });
    expect(findPosition([], 64)).toEqual({ paragraph: 0, offset: 0 });
  });
});

describe('scrollDeltaFor', () => {
  it('is the inverse of findPosition', () => {
    const position = findPosition(blocks, 64);
    expect(scrollDeltaFor(blocks, position, 64)).toBeCloseTo(0);
  });

  it('keeps the same paragraph on the reading line after a relayout', () => {
    // Same content after the font grew: every block is taller and further down.
    const larger = [
      { top: -600, height: 400 },
      { top: -200, height: 400 },
      { top: 200, height: 400 },
    ];
    const delta = scrollDeltaFor(larger, { paragraph: 1, offset: 0.82 }, 64);
    const shifted = larger.map((block) => ({ ...block, top: block.top - delta }));
    expect(findPosition(shifted, 64)).toEqual({ paragraph: 1, offset: 0.82 });
  });

  it('clamps paragraph indexes past the end', () => {
    expect(scrollDeltaFor(blocks, { paragraph: 99, offset: 0 }, 64)).toBe(36);
  });
});

describe('sanitizeProgressMap', () => {
  it('keeps valid entries only', () => {
    const at = '2026-09-24T10:00:00Z';
    expect(
      sanitizeProgressMap({
        valid: { chapter: 'bab', paragraph: 3, offset: 1.5, at },
        withOrder: { chapter: 'bab', paragraph: 0, offset: 0, at, order: 2 },
        badOrder: { chapter: 'bab', paragraph: 0, offset: 0, at, order: 0 },
        badParagraph: { chapter: 'bab', paragraph: -1, offset: 0, at },
        missingChapter: { paragraph: 1, offset: 0, at },
      }),
    ).toEqual({
      valid: { chapter: 'bab', paragraph: 3, offset: 1, at },
      withOrder: { chapter: 'bab', paragraph: 0, offset: 0, at, order: 2 },
      badOrder: { chapter: 'bab', paragraph: 0, offset: 0, at },
    });
    expect(sanitizeProgressMap([])).toEqual({});
    expect(sanitizeProgressMap(undefined)).toEqual({});
  });
});

describe('scrollFraction', () => {
  it('is 0 at the top, 1 at the bottom, and 1 when nothing scrolls', () => {
    expect(scrollFraction(0, 2000, 800)).toBe(0);
    expect(scrollFraction(1200, 2000, 800)).toBe(1);
    expect(scrollFraction(0, 700, 800)).toBe(1);
  });
});
