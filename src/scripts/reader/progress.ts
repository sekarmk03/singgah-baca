import {
  findPosition,
  sanitizeProgressMap,
  scrollDeltaFor,
  scrollFraction,
  type ChapterPosition,
  type ProgressMap,
} from '../../lib/reading-progress';
import { readJson, STORAGE_KEYS, writeJson } from '../../lib/storage';

const SAVE_DELAY_MS = 500;

export function readProgressMap(): ProgressMap {
  return sanitizeProgressMap(readJson(STORAGE_KEYS.progress));
}

/** Tracks and restores the reading position inside one chapter. */
export class ChapterProgress {
  private saveTimer: number | undefined;
  /** Saving waits until the stored position has been restored, so it is never overwritten. */
  private ready = false;

  constructor(
    private readonly prose: HTMLElement,
    private readonly story: string,
    private readonly chapter: string,
  ) {}

  capture(): ChapterPosition {
    return findPosition(this.boxes());
  }

  restore(position: ChapterPosition): void {
    window.scrollBy(0, scrollDeltaFor(this.boxes(), position));
  }

  /** Runs a layout-changing callback while keeping the same paragraph on screen. */
  preserve(change: () => void): void {
    const position = this.capture();
    change();
    this.restore(position);
  }

  saved(): ChapterPosition | undefined {
    const entry = readProgressMap()[this.story];
    return entry?.chapter === this.chapter ? entry : undefined;
  }

  save(): void {
    window.clearTimeout(this.saveTimer);
    if (!this.ready) return;
    const map = readProgressMap();
    map[this.story] = { chapter: this.chapter, ...this.capture(), at: new Date().toISOString() };
    writeJson(STORAGE_KEYS.progress, map);
  }

  async start(): Promise<void> {
    // The browser's own scroll restoration would fight ours after a font size change.
    history.scrollRestoration = 'manual';
    const saved = this.saved();
    if (saved && !location.hash) {
      await document.fonts.ready;
      this.restore(saved);
    }
    this.ready = true;
    this.save();
  }

  scheduleSave(): void {
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.save(), SAVE_DELAY_MS);
  }

  private boxes() {
    return Array.from(this.prose.children, (block) => {
      const { top, height } = block.getBoundingClientRect();
      return { top, height };
    });
  }
}

export function initProgress(prose: HTMLElement, story: string, chapter: string) {
  const progress = new ChapterProgress(prose, story, chapter);
  void progress.start();

  window.addEventListener('scroll', () => progress.scheduleSave(), { passive: true });
  window.addEventListener('pagehide', () => progress.save());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') progress.save();
  });

  return progress;
}

export function initRibbon(ribbon: HTMLElement): void {
  let frame = 0;
  const update = () => {
    frame = 0;
    const { scrollHeight } = document.documentElement;
    const fraction = scrollFraction(window.scrollY, scrollHeight, window.innerHeight);
    ribbon.style.setProperty('--progress', fraction.toFixed(3));
    ribbon.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
  };
  const requestUpdate = () => {
    frame ||= requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}
