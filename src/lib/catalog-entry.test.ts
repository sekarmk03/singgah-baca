import { describe, expect, it } from 'vitest';
import { truncate } from './catalog-entry';

describe('truncate', () => {
  it('keeps short text and cuts long text at a word boundary', () => {
    expect(truncate('Hujan turun.', 160)).toBe('Hujan turun.');
    expect(truncate('Kereta terakhir ke Kenari terlambat dua jam', 20)).toBe('Kereta terakhir ke…');
  });
});
