import { initChapterPicker, initKeyboard, initToolbar } from './navigation';
import { initProgress, initRibbon } from './progress';
import { initSettings } from './settings';

const reader = document.querySelector<HTMLElement>('[data-reader]');

if (reader) {
  const { story = '', chapter = '', previousUrl, nextUrl } = reader.dataset;
  const prose = reader.querySelector<HTMLElement>('[data-prose]')!;
  const toolbar = document.querySelector<HTMLElement>('[data-toolbar]')!;

  initToolbar(toolbar, reader);
  initKeyboard(previousUrl, nextUrl);
  initRibbon(document.querySelector<HTMLElement>('[data-ribbon]')!);

  const picker = toolbar.querySelector<HTMLSelectElement>('[data-chapter-picker]');
  if (picker) initChapterPicker(picker);

  const progress = initProgress(prose, story, chapter);
  initSettings(
    document.querySelector<HTMLDialogElement>('#reader-settings')!,
    toolbar.querySelector<HTMLButtonElement>('[data-settings-open]')!,
    progress,
  );
}
