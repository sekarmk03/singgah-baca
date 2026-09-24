import { getGenreName, type GenreSlug } from '../../data/genres';
import { formatChapterCount, formatReadingTime, t } from '../../i18n/id';
import type { CatalogEntry } from '../../lib/catalog';
import './story-card.css';

interface Props {
  entry: CatalogEntry;
  /** Replaces the length line when the reader has progress, e.g. "Bab 3 dari 12". */
  progressLabel?: string;
  /** Keeps the page outline valid: 2 directly under the page title, 3 under a section heading. */
  headingLevel?: 2 | 3;
}

const MAX_GENRES = 3;

export function StoryCard({ entry, progressLabel, headingLevel = 2 }: Props) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const length =
    entry.category === 'novel'
      ? formatChapterCount(entry.chapterCount)
      : formatReadingTime(entry.readingMinutes);
  const genres = entry.genres
    .slice(0, MAX_GENRES)
    .map((genre) => getGenreName(genre as GenreSlug))
    .join(', ');

  return (
    <article class="story-card">
      <Heading class="story-card__title">
        <a href={`/cerita/${entry.slug}`}>{entry.title}</a>
      </Heading>
      <p class="story-card__meta ui muted">
        {[entry.authorName, t.category[entry.category], t.status[entry.status]].join(' · ')}
      </p>
      <p class="story-card__synopsis">{entry.synopsis}</p>
      <p class="story-card__meta ui muted">
        {genres} ·{' '}
        {progressLabel ? <strong class="story-card__progress">{progressLabel}</strong> : length}
      </p>
    </article>
  );
}
