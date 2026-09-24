import { useState } from 'preact/hooks';
import { formatOptionCount, t } from '../../i18n/id';
import type { CatalogState, FacetCounts } from '../../lib/catalog';
import type { Duration, StoryStatus } from '../../lib/url-params';

export interface Option {
  slug: string;
  name: string;
}

interface Props {
  state: CatalogState;
  facets: FacetCounts;
  genres: Option[];
  authors: Option[];
  onToggleGenre: (slug: string) => void;
  onToggleAuthor: (slug: string) => void;
  onStatus: (status?: StoryStatus) => void;
  onDuration: (duration?: Duration) => void;
}

const STATUSES: StoryStatus[] = ['completed', 'ongoing'];
const DURATIONS: Duration[] = ['short', 'medium', 'long'];
/** Above this many authors the list gets its own search box. */
const AUTHOR_SEARCH_THRESHOLD = 6;

export function FilterPanel(props: Props) {
  const { state, facets, genres, authors } = props;
  const [authorQuery, setAuthorQuery] = useState('');
  const needle = authorQuery.trim().toLocaleLowerCase('id');
  const visibleAuthors = needle
    ? authors.filter(
        (author) =>
          state.authors.includes(author.slug) ||
          author.name.toLocaleLowerCase('id').includes(needle),
      )
    : authors;

  return (
    <div class="filter-panel ui">
      <fieldset>
        <legend>{t.catalog.genre}</legend>
        {genres.map((genre) => (
          <CheckOption
            key={genre.slug}
            label={genre.name}
            count={facets.genres[genre.slug] ?? 0}
            checked={state.genres.includes(genre.slug)}
            onChange={() => props.onToggleGenre(genre.slug)}
          />
        ))}
      </fieldset>

      <fieldset>
        <legend>{t.catalog.author}</legend>
        {authors.length > AUTHOR_SEARCH_THRESHOLD && (
          <input
            type="search"
            class="filter-panel__search"
            aria-label={t.catalog.authorSearch}
            placeholder={t.catalog.authorSearch}
            value={authorQuery}
            onInput={(event) => setAuthorQuery(event.currentTarget.value)}
          />
        )}
        <div class="filter-panel__scroll">
          {visibleAuthors.map((author) => (
            <CheckOption
              key={author.slug}
              label={author.name}
              count={facets.authors[author.slug] ?? 0}
              checked={state.authors.includes(author.slug)}
              onChange={() => props.onToggleAuthor(author.slug)}
            />
          ))}
        </div>
      </fieldset>

      <RadioGroup
        name="status"
        legend={t.catalog.status}
        options={STATUSES.map((status) => ({
          value: status,
          label: t.status[status],
          count: facets.status[status] ?? 0,
        }))}
        value={state.status}
        onChange={(value) => props.onStatus(value as StoryStatus | undefined)}
      />

      <RadioGroup
        name="duration"
        legend={t.catalog.duration}
        options={DURATIONS.map((duration) => ({
          value: duration,
          label: t.catalog.durations[duration],
          count: facets.duration[duration] ?? 0,
        }))}
        value={state.duration}
        onChange={(value) => props.onDuration(value as Duration | undefined)}
      />
    </div>
  );
}

function CheckOption(props: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  const empty = props.count === 0 && !props.checked;
  return (
    <label class={`filter-option${empty ? ' is-empty' : ''}`}>
      <input type="checkbox" checked={props.checked} onChange={props.onChange} />
      <span>{formatOptionCount(props.label, props.count)}</span>
    </label>
  );
}

function RadioGroup(props: {
  name: string;
  legend: string;
  options: { value: string; label: string; count: number }[];
  value?: string;
  onChange: (value?: string) => void;
}) {
  return (
    <fieldset>
      <legend>{props.legend}</legend>
      <label class="filter-option">
        <input
          type="radio"
          name={props.name}
          checked={!props.value}
          onChange={() => props.onChange(undefined)}
        />
        <span>{t.catalog.all}</span>
      </label>
      {props.options.map((option) => {
        const checked = props.value === option.value;
        const empty = option.count === 0 && !checked;
        return (
          <label key={option.value} class={`filter-option${empty ? ' is-empty' : ''}`}>
            <input
              type="radio"
              name={props.name}
              checked={checked}
              onChange={() => props.onChange(option.value)}
            />
            <span>{formatOptionCount(option.label, option.count)}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
