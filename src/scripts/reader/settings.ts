import { formatFontSize, formatLineHeight, formatMeasure } from '../../i18n/id';
import {
  canStep,
  stepPreference,
  THEMES,
  type NumericPreference,
  type ReaderPreferences,
  type ThemeName,
} from '../../lib/preferences';
import {
  applyPreferences,
  currentValue,
  isJustified,
  loadPreferences,
  savePreferences,
} from './preferences';
import type { ChapterProgress } from './progress';

const SWIPE_CLOSE_PX = 80;

const formatters: Record<NumericPreference, (value: number) => string> = {
  size: formatFontSize,
  leading: formatLineHeight,
  measure: formatMeasure,
};

export function initSettings(
  dialog: HTMLDialogElement,
  opener: HTMLButtonElement,
  progress: ChapterProgress,
): void {
  let preferences = loadPreferences();

  const sync = () => {
    const theme = preferences.theme ?? 'auto';
    dialog.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => {
      input.checked = input.value === theme;
    });
    for (const key of Object.keys(formatters) as NumericPreference[]) {
      const value = currentValue(key);
      dialog.querySelector(`[data-output="${key}"]`)!.textContent = formatters[key](value);
      dialog.querySelectorAll<HTMLButtonElement>(`[data-step="${key}"]`).forEach((button) => {
        button.disabled = !canStep(key, Number(button.dataset.direction) as 1 | -1, value);
      });
    }
    dialog.querySelector<HTMLInputElement>('[data-justify]')!.checked = isJustified();
  };

  const update = (next: ReaderPreferences) => {
    preferences = next;
    progress.preserve(() => applyPreferences(preferences));
    savePreferences(preferences);
    sync();
  };

  opener.addEventListener('click', () => {
    sync();
    dialog.showModal();
  });
  dialog.addEventListener('close', () => opener.focus());

  // A click on the backdrop lands on the <dialog> itself; clicks inside land on its children.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelector('[data-settings-close]')!.addEventListener('click', () => dialog.close());

  dialog.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.name === 'theme') {
      const theme = THEMES.includes(input.value as ThemeName)
        ? (input.value as ThemeName)
        : undefined;
      update({ ...preferences, theme });
    } else if (input.matches('[data-justify]')) {
      update({ ...preferences, justify: input.checked });
    }
  });

  dialog.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.step as NumericPreference;
      const direction = Number(button.dataset.direction) as 1 | -1;
      update(stepPreference(preferences, key, direction, currentValue(key)));
    });
  });

  dialog.querySelector('[data-settings-reset]')!.addEventListener('click', () => update({}));

  initSwipeToClose(dialog);
}

/** Bottom sheet: dragging the handle area down closes the panel. */
function initSwipeToClose(dialog: HTMLDialogElement): void {
  const handle = dialog.querySelector<HTMLElement>('.head')!;
  const sheet = dialog.querySelector<HTMLElement>('.sheet')!;
  let startY: number | undefined;

  handle.addEventListener('pointerdown', (event) => {
    if ((event.target as Element).closest('button')) return;
    startY = event.clientY;
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', (event) => {
    if (startY === undefined) return;
    const distance = Math.max(0, event.clientY - startY);
    sheet.style.transform = `translateY(${distance}px)`;
  });
  const end = (event: PointerEvent) => {
    if (startY === undefined) return;
    const distance = event.clientY - startY;
    startY = undefined;
    sheet.style.transform = '';
    if (distance > SWIPE_CLOSE_PX) dialog.close();
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}
