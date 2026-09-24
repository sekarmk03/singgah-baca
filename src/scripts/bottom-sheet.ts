const SWIPE_CLOSE_PX = 80;

/**
 * Bottom sheets close when their header is dragged down past a threshold.
 * Returns a cleanup function for callers with a lifecycle (Preact effects).
 */
export function attachSwipeToClose(
  dialog: HTMLDialogElement,
  handle: HTMLElement,
  sheet: HTMLElement,
): () => void {
  let startY: number | undefined;

  const onDown = (event: PointerEvent) => {
    if ((event.target as Element).closest('button, input, select, a')) return;
    startY = event.clientY;
    handle.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    if (startY === undefined) return;
    sheet.style.transform = `translateY(${Math.max(0, event.clientY - startY)}px)`;
  };
  const onEnd = (event: PointerEvent) => {
    if (startY === undefined) return;
    const distance = event.clientY - startY;
    startY = undefined;
    sheet.style.transform = '';
    if (distance > SWIPE_CLOSE_PX) dialog.close();
  };

  handle.addEventListener('pointerdown', onDown);
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onEnd);
  handle.addEventListener('pointercancel', onEnd);
  return () => {
    handle.removeEventListener('pointerdown', onDown);
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onEnd);
    handle.removeEventListener('pointercancel', onEnd);
  };
}

/** Closes a modal dialog when its backdrop (the <dialog> element itself) is clicked. */
export function closeOnBackdropClick(dialog: HTMLDialogElement): () => void {
  const onClick = (event: MouseEvent) => {
    if (event.target === dialog) dialog.close();
  };
  dialog.addEventListener('click', onClick);
  return () => dialog.removeEventListener('click', onClick);
}
