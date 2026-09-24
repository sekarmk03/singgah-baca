import { describe, expect, it } from 'vitest';
import { formatChapterPosition, formatDate, formatNumber, formatReadingTime } from './id';

describe('Indonesian formatters', () => {
  it('formats dates in Indonesian', () => {
    expect(formatDate(new Date('2026-09-24T10:00:00Z'))).toBe('24 September 2026');
  });

  it('uses a dot as the thousands separator', () => {
    expect(formatNumber(1000)).toBe('1.000');
  });

  it('formats reading time and chapter position', () => {
    expect(formatReadingTime(9)).toBe('sekitar 9 menit');
    expect(formatChapterPosition(2, 12)).toBe('Bab 2 dari 12');
  });
});

describe('reader setting labels', () => {
  it('formats values the Indonesian way', async () => {
    const { formatFontSize, formatLineHeight, formatMeasure } = await import('./id');
    expect(formatFontSize(19)).toBe('19 px');
    expect(formatLineHeight(1.75)).toBe('1,75');
    expect(formatLineHeight(2)).toBe('2,00');
    expect(formatMeasure(34)).toBe('± 65 karakter');
  });
});
