const SCROLL_THRESHOLD_PX = 4;
const INTERACTIVE = 'a, button, select, input, textarea, label, summary, dialog, [role="button"]';

/** Hides the toolbar while scrolling down; shows it on scroll up or a tap in the middle band. */
export function initToolbar(toolbar: HTMLElement, content: HTMLElement): void {
  let lastY = window.scrollY;
  let frame = 0;

  const setHidden = (hidden: boolean) => {
    toolbar.dataset.hidden = String(hidden);
  };

  const onScroll = () => {
    frame = 0;
    const y = window.scrollY;
    const delta = y - lastY;
    if (Math.abs(delta) < SCROLL_THRESHOLD_PX) return;
    lastY = y;
    if (toolbar.contains(document.activeElement)) return;
    setHidden(delta > 0 && y > toolbar.offsetHeight);
  };

  window.addEventListener(
    'scroll',
    () => {
      frame ||= requestAnimationFrame(onScroll);
    },
    { passive: true },
  );

  toolbar.addEventListener('focusin', () => setHidden(false));

  content.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target.closest(INTERACTIVE)) return;
    if (!window.getSelection()?.isCollapsed) return;
    const band = window.innerHeight / 3;
    if (event.clientY > band && event.clientY < band * 2) {
      setHidden(toolbar.dataset.hidden !== 'true');
    }
  });
}

export function initChapterPicker(select: HTMLSelectElement): void {
  select.addEventListener('change', () => window.location.assign(select.value));
}

/** ← and → move between chapters. */
export function initKeyboard(previousUrl?: string, nextUrl?: string): void {
  document.addEventListener('keydown', (event) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('input, select, textarea, [contenteditable], dialog[open]')) return;

    const url =
      event.key === 'ArrowLeft' ? previousUrl : event.key === 'ArrowRight' ? nextUrl : null;
    if (url) {
      event.preventDefault();
      window.location.assign(url);
    }
  });
}
