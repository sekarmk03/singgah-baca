import { useEffect, useRef, useState } from 'preact/hooks';
import { formatChapterPosition, formatLastRead, t } from '../../i18n/id';
import {
  backupFileName,
  createBackup,
  mergeReaderData,
  parseBackup,
  type ReaderData,
} from '../../lib/backup';
import type { CatalogEntry } from '../../lib/catalog';
import { recentReading } from '../../lib/continue-reading';
import { toggleShelf } from '../../lib/shelf';
import { applyPreferences } from '../../scripts/reader/preferences';
import {
  clearReadingHistory,
  loadReaderData,
  saveReaderData,
  saveShelf,
} from '../../scripts/reader-data';
import { StoryCard } from '../catalog/StoryCard';
import './shelf.css';

/** Shows every story with progress, not just the three the catalog shows. */
const HISTORY_LIMIT = Number.POSITIVE_INFINITY;

export default function Shelf() {
  const [data, setData] = useState<ReaderData | null>(null);
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setData(loadReaderData());
    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  if (!data || !entries) {
    return <p class="ui muted">{t.shelf.loading}</p>;
  }

  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  // Stories removed from the site are skipped rather than shown as broken cards.
  const saved = data.shelf.flatMap((slug) => bySlug.get(slug) ?? []);
  const history = recentReading(data.progress, entries, HISTORY_LIMIT);

  const persist = (next: ReaderData, success: string) => {
    setData(next);
    setMessage(saveReaderData(next) ? success : t.shelf.storageUnavailable);
  };

  const removeFromShelf = (slug: string) => {
    const shelf = toggleShelf(data.shelf, slug);
    setData({ ...data, shelf });
    setMessage(saveShelf(shelf) ? t.shelf.removedStatus : t.shelf.storageUnavailable);
  };

  const exportData = () => {
    const now = new Date();
    const blob = new Blob([JSON.stringify(createBackup(data, now), null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = backupFileName(now);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importData = async (file: File) => {
    const incoming = parseBackup(await file.text());
    if (!incoming) {
      setMessage(t.shelf.importError);
      return;
    }
    const merged = mergeReaderData(data, incoming);
    applyPreferences(merged.preferences);
    persist(merged, t.shelf.imported);
  };

  const clearHistory = () => {
    if (!window.confirm(t.shelf.clearConfirm)) return;
    clearReadingHistory();
    setData({ ...data, progress: {} });
    setMessage(t.shelf.historyCleared);
  };

  return (
    <div class="shelf">
      <p class="shelf__message ui" role="status">
        {message}
      </p>

      <section aria-labelledby="saved-heading">
        <h2 id="saved-heading">{t.shelf.savedHeading}</h2>
        {saved.length === 0 ? (
          <p class="muted">{t.shelf.savedEmpty}</p>
        ) : (
          <ul class="shelf__saved story-grid story-grid--wide">
            {saved.map((entry) => (
              <li key={entry.slug}>
                <StoryCard entry={entry} headingLevel={3} />
                <button
                  type="button"
                  class="text-button shelf__remove"
                  aria-label={`${t.shelf.remove}: ${entry.title}`}
                  onClick={() => removeFromShelf(entry.slug)}
                >
                  {t.shelf.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">{t.shelf.historyHeading}</h2>
        {history.length === 0 ? (
          <p class="muted">{t.shelf.historyEmpty}</p>
        ) : (
          <ul class="shelf__history">
            {history.map(({ entry, progress, url }) => (
              <li key={entry.slug}>
                <a href={url} aria-label={`${t.shelf.continue}: ${entry.title}`}>
                  <span class="shelf__title">{entry.title}</span>
                  <span class="ui muted">
                    {entry.category === 'novel' && progress.order
                      ? `${formatChapterPosition(progress.order, entry.chapterCount)} · `
                      : ''}
                    {formatLastRead(new Date(progress.at))}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="data-heading" class="shelf__data">
        <h2 id="data-heading">{t.shelf.dataHeading}</h2>
        <p class="ui muted">{t.shelf.dataHint}</p>
        <div class="shelf__actions">
          <button type="button" class="button" onClick={exportData}>
            {t.shelf.export}
          </button>
          <button
            type="button"
            class="button button--secondary"
            onClick={() => fileInput.current?.click()}
          >
            {t.shelf.import}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (file) void importData(file);
            }}
          />
          {history.length > 0 && (
            <button type="button" class="text-button" onClick={clearHistory}>
              {t.shelf.clearHistory}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
