import { t } from '../i18n/id';
import { readProgressMap } from './reader/progress';

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
