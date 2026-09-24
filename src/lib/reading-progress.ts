/**
 * Reading position stored as "which paragraph, and how far into it", so the position survives
 * changes to font size, line height and column width. Persisted under `singgah-baca:v1:progress`.
 */

export interface ChapterPosition {
  /** Index of the block (paragraph, scene break, …) at the reading line. */
  paragraph: number;
  /** How far the reading line is into that block, 0–1. */
  offset: number;
}

export interface StoryProgress extends ChapterPosition {
  /** Chapter slug. */
  chapter: string;
  /** ISO timestamp of the last save. */
  at: string;
}

export type ProgressMap = Record<string, StoryProgress>;

/** Vertical box of a block relative to the viewport, as returned by `getBoundingClientRect()`. */
export interface BlockBox {
  top: number;
  height: number;
}

/**
 * Distance from the top of the viewport treated as "where the reader is looking".
 * Sits just below the toolbar so capture and restore agree whether the toolbar is shown or not.
 */
export const READING_LINE_PX = 64;

export function findPosition(blocks: BlockBox[], readingLine = READING_LINE_PX): ChapterPosition {
  if (blocks.length === 0) return { paragraph: 0, offset: 0 };

  const index = blocks.findIndex((block) => block.top + block.height > readingLine);
  if (index === -1) return { paragraph: blocks.length - 1, offset: 1 };

  const block = blocks[index];
  const offset = block.height > 0 ? (readingLine - block.top) / block.height : 0;
  return { paragraph: index, offset: roundOffset(clamp01(offset)) };
}

/** Scroll delta that puts `position` back on the reading line. */
export function scrollDeltaFor(
  blocks: BlockBox[],
  position: ChapterPosition,
  readingLine = READING_LINE_PX,
): number {
  const block = blocks[Math.min(position.paragraph, blocks.length - 1)];
  if (!block) return 0;
  return block.top + position.offset * block.height - readingLine;
}

/** Keeps only well-formed entries from untrusted stored data. */
export function sanitizeProgressMap(raw: unknown): ProgressMap {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const result: ProgressMap = {};
  for (const [story, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue;
    const entry = value as Record<string, unknown>;
    if (
      typeof entry.chapter === 'string' &&
      Number.isInteger(entry.paragraph) &&
      (entry.paragraph as number) >= 0 &&
      typeof entry.offset === 'number' &&
      typeof entry.at === 'string'
    ) {
      result[story] = {
        chapter: entry.chapter,
        paragraph: entry.paragraph as number,
        offset: clamp01(entry.offset),
        at: entry.at,
      };
    }
  }
  return result;
}

/** Fraction of the page scrolled, 0–1, for the progress ribbon. */
export function scrollFraction(scrollY: number, scrollHeight: number, viewportHeight: number) {
  const scrollable = scrollHeight - viewportHeight;
  return scrollable <= 0 ? 1 : clamp01(scrollY / scrollable);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function roundOffset(value: number): number {
  return Math.round(value * 1000) / 1000;
}
