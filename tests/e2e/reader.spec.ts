import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const CHAPTER_1 = '/cerita/hujan-di-stasiun-terakhir/kereta-yang-terlambat';
const CHAPTER_2 = '/cerita/hujan-di-stasiun-terakhir/rumah-di-jalan-kenari';
const PREFS_KEY = 'singgah-baca:v1:prefs';
const PROGRESS_KEY = 'singgah-baca:v1:progress';
const READING_LINE = 64;

/** Paragraph index and offset at the reading line, computed the same way the reader does. */
function currentPosition(page: Page) {
  return page.evaluate((line) => {
    const blocks = Array.from(document.querySelector('[data-prose]')!.children);
    const index = blocks.findIndex((block) => block.getBoundingClientRect().bottom > line);
    const { top, height } = blocks[index].getBoundingClientRect();
    return { paragraph: index, offset: (line - top) / height };
  }, READING_LINE);
}

async function scrollToParagraph(page: Page, index: number) {
  await page.evaluate(
    ({ index, line }) => {
      const block = document.querySelector('[data-prose]')!.children[index];
      window.scrollBy(0, block.getBoundingClientRect().top + 10 - line);
    },
    { index, line: READING_LINE },
  );
}

/** Scrolls programmatically; mobile WebKit does not support mouse wheel events. */
async function scrollBy(page: Page, delta: number) {
  await page.evaluate((y) => window.scrollBy(0, y), delta);
}

/** Taps the middle of the screen, which brings back a toolbar hidden by scrolling. */
async function revealToolbar(page: Page) {
  const toolbar = page.locator('[data-toolbar]');
  // The toolbar reacts to scrolling on the next animation frame; let that settle first.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  if ((await toolbar.getAttribute('data-hidden')) === 'true') {
    const { width, height } = page.viewportSize()!;
    await page.mouse.click(width / 2, height / 2);
  }
  await expect(toolbar).toHaveAttribute('data-hidden', 'false');
}

test.describe('preferences', () => {
  test('applies stored preferences from the inline head script', async ({ page }) => {
    await page.addInitScript(
      ([key]) => localStorage.setItem(key, JSON.stringify({ theme: 'night', size: 22 })),
      [PREFS_KEY],
    );
    await page.goto(CHAPTER_1);
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'night');
    await expect(html).toHaveAttribute('data-hyphenation', /supported|unsupported/);
    const fontSize = await page
      .locator('[data-prose]')
      .evaluate((element) => getComputedStyle(element).fontSize);
    expect(fontSize).toBe('22px');
  });

  test('ignores invalid stored preferences', async ({ page }) => {
    await page.addInitScript(
      ([key]) => localStorage.setItem(key, JSON.stringify({ theme: 'neon', size: 99 })),
      [PREFS_KEY],
    );
    await page.goto(CHAPTER_1);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    const inline = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--reader-font-size'),
    );
    expect(inline).toBe('');
  });

  test('settings panel changes and saves typography and theme', async ({ page }) => {
    await page.goto(CHAPTER_1);
    const opener = page.getByRole('button', { name: 'Pengaturan baca' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Pengaturan baca' });
    await expect(dialog).toBeVisible();

    const sizeOutput = dialog.locator('[data-output="size"]');
    const before = parseInt((await sizeOutput.textContent()) ?? '0', 10);
    await dialog.getByRole('button', { name: 'Perbesar huruf' }).click();
    await expect(sizeOutput).toHaveText(`${before + 1} px`);

    await dialog.locator('label', { hasText: 'Sepia' }).click();
    await expect(dialog.getByRole('radio', { name: 'Sepia' })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sepia');

    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), PREFS_KEY);
    expect(saved).toMatchObject({ size: before + 1, theme: 'sepia' });

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('reset returns to defaults', async ({ page }) => {
    await page.addInitScript(
      ([key]) => localStorage.setItem(key, JSON.stringify({ theme: 'night', size: 24 })),
      [PREFS_KEY],
    );
    await page.goto(CHAPTER_1);
    await page.getByRole('button', { name: 'Pengaturan baca' }).click();
    await page.getByRole('button', { name: 'Atur ulang' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    expect(await page.evaluate((key) => localStorage.getItem(key), PREFS_KEY)).toBeNull();
  });

  test('has no accessibility violations with the panel open', async ({ page }) => {
    await page.goto(CHAPTER_1);
    await page.getByRole('button', { name: 'Pengaturan baca' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('reading progress', () => {
  test('returns to the same paragraph after a reload', async ({ page }) => {
    await page.goto(CHAPTER_1);
    await scrollToParagraph(page, 6);
    const before = await currentPosition(page);
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY))
      .toContain('"paragraph":6');

    await page.reload();
    await expect.poll(() => currentPosition(page).then((p) => p.paragraph)).toBe(6);
    const after = await currentPosition(page);
    expect(after.offset).toBeCloseTo(before.offset, 1);
  });

  test('keeps the same paragraph when the font size changes', async ({ page }) => {
    await page.goto(CHAPTER_1);
    await scrollToParagraph(page, 5);
    const before = await currentPosition(page);

    await revealToolbar(page);
    await page.getByRole('button', { name: 'Pengaturan baca' }).click();
    const larger = page.getByRole('button', { name: 'Perbesar huruf' });
    await larger.click();
    await larger.click();
    await larger.click();
    await page.getByRole('button', { name: 'Tutup' }).click();

    const after = await currentPosition(page);
    expect(after.paragraph).toBe(before.paragraph);
    expect(after.offset).toBeCloseTo(before.offset, 1);
  });

  test('the story page offers to continue from the last chapter', async ({ page }) => {
    await page.goto(CHAPTER_2);
    await page.goto('/cerita/hujan-di-stasiun-terakhir');
    const button = page.getByRole('link', { name: 'Lanjutkan membaca' });
    await expect(button).toHaveAttribute('href', CHAPTER_2);
    await expect(page.getByText('Terakhir dibaca: Bab 2 · Rumah di Jalan Kenari')).toBeVisible();
  });

  test('ignores progress for chapters that no longer exist', async ({ page }) => {
    await page.addInitScript(
      ([key]) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            'hujan-di-stasiun-terakhir': {
              chapter: 'bab-yang-dihapus',
              paragraph: 3,
              offset: 0,
              at: '2026-09-24T10:00:00Z',
            },
          }),
        ),
      [PROGRESS_KEY],
    );
    await page.goto('/cerita/hujan-di-stasiun-terakhir');
    await expect(page.getByRole('link', { name: 'Mulai membaca' })).toBeVisible();
  });

  test('the ribbon grows while scrolling', async ({ page }) => {
    await page.goto(CHAPTER_1);
    const ribbon = page.getByRole('progressbar', { name: 'Progres membaca bab ini' });
    await expect(ribbon).toHaveAttribute('aria-valuenow', '0');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(ribbon).toHaveAttribute('aria-valuenow', '100');
  });
});

test.describe('navigation', () => {
  test('arrow keys move between chapters', async ({ page }) => {
    await page.goto(CHAPTER_1);
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`${CHAPTER_2}$`));
    // The URL changes before the new page's module script has attached its key listener.
    await page.waitForLoadState('load');
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`${CHAPTER_1}$`));
  });

  test('the chapter picker opens the chosen chapter', async ({ page }) => {
    await page.goto(CHAPTER_1);
    await page.getByRole('combobox', { name: 'Pilih bab' }).selectOption({ index: 1 });
    await expect(page).toHaveURL(new RegExp(`${CHAPTER_2}$`));
  });

  test('the toolbar hides on scroll down and returns on scroll up', async ({ page }) => {
    await page.goto(CHAPTER_1);
    const toolbar = page.locator('[data-toolbar]');
    await scrollBy(page, 600);
    await expect(toolbar).toHaveAttribute('data-hidden', 'true');
    await scrollBy(page, -200);
    await expect(toolbar).toHaveAttribute('data-hidden', 'false');
  });

  test('a tap in the middle of the screen toggles the toolbar', async ({ page }) => {
    await page.goto(CHAPTER_1);
    const toolbar = page.locator('[data-toolbar]');
    await scrollBy(page, 600);
    await expect(toolbar).toHaveAttribute('data-hidden', 'true');
    await revealToolbar(page);
  });
});

test('works when localStorage is blocked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const blocked = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
    Storage.prototype.getItem = blocked;
    Storage.prototype.setItem = blocked;
    Storage.prototype.removeItem = blocked;
  });

  await page.goto(CHAPTER_1);
  await page.getByRole('button', { name: 'Pengaturan baca' }).click();
  await page.getByRole('button', { name: 'Perbesar huruf' }).click();
  await page.locator('label', { hasText: 'Malam' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await page.goto('/cerita/hujan-di-stasiun-terakhir');
  await expect(page.getByRole('link', { name: 'Mulai membaca' })).toBeVisible();
  expect(errors).toEqual([]);
});
