import { t } from '../i18n/id';
import { toggleShelf } from '../lib/shelf';
import { readProgressMap } from './reader/progress';
import { loadShelf, saveShelf } from './reader-data';

interface ChapterLink {
  slug: string;
  url: string;
  label: string;
}

const container = document.querySelector<HTMLElement>('[data-continue]');

if (container) {
  const chapters = JSON.parse(container.dataset.chapters ?? '[]') as ChapterLink[];
  const saved = readProgressMap()[container.dataset.story ?? ''];
  // Progress pointing at a chapter that no longer exists is ignored.
  const chapter = saved && chapters.find((item) => item.slug === saved.chapter);

  if (chapter) {
    const button = container.querySelector<HTMLAnchorElement>('a')!;
    button.href = chapter.url;
    button.textContent = t.story.continue;

    if (chapter.label) {
      const lastRead = container.querySelector<HTMLElement>('.last-read')!;
      lastRead.textContent = `${t.story.lastRead} ${chapter.label}`;
      lastRead.hidden = false;
    }
  }
}

// "Simpan ke Rak" needs storage, so the button stays invisible (but keeps its space) until this runs.
const shelfButton = document.querySelector<HTMLButtonElement>('[data-shelf-toggle]');

if (shelfButton) {
  const story = shelfButton.dataset.story ?? '';
  const status = document.querySelector<HTMLElement>('.shelf-status')!;
  const render = () => {
    shelfButton.textContent = loadShelf().includes(story) ? t.shelf.remove : t.shelf.save;
  };

  shelfButton.addEventListener('click', () => {
    const next = toggleShelf(loadShelf(), story);
    if (!saveShelf(next)) {
      status.textContent = t.shelf.storageUnavailable;
      return;
    }
    status.textContent = next.includes(story) ? t.shelf.savedStatus : t.shelf.removedStatus;
    render();
  });

  render();
  delete shelfButton.dataset.pending;
}
