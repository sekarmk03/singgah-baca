import { describe, expect, it } from 'vitest';
import { dummyEntries } from '../../tests/fixtures/catalog';
import { recentReading } from './continue-reading';

describe('recentReading', () => {
  it('lists existing stories newest first and skips removed ones', () => {
    const entries = dummyEntries(3);
    const saved = (at: string) => ({ chapter: 'bab', paragraph: 0, offset: 0, at });
    const result = recentReading(
      {
        'cerita-0': saved('2026-09-01T00:00:00Z'),
        'cerita-2': saved('2026-09-03T00:00:00Z'),
        'cerita-dihapus': saved('2026-09-05T00:00:00Z'),
      },
      entries,
    );
    expect(result.map((item) => item.entry.slug)).toEqual(['cerita-2', 'cerita-0']);
    expect(result[0].url).toBe('/cerita/cerita-2/bab');
  });
});
