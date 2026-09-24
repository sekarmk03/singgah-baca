import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const STORY = '/cerita/surat-untuk-ibu';
const SHELF_KEY = 'singgah-baca:v1:shelf';
const PROGRESS_KEY = 'singgah-baca:v1:progress';

const storage = (page: Page, key: string) =>
  page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? 'null'), key);

function backupFile(content: unknown) {
  return {
    name: 'cadangan.json',
    mimeType: 'application/json',
    buffer: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)),
  };
}

test('saves a story to the shelf and removes it again', async ({ page }) => {
  await page.goto(STORY);
  await page.getByRole('button', { name: 'Simpan ke Rak' }).click();
  await expect(page.getByRole('status')).toHaveText('Cerita disimpan di Rak.');
  expect(await storage(page, SHELF_KEY)).toEqual(['surat-untuk-ibu']);

  await page.getByRole('link', { name: 'Rak saya' }).click();
  const saved = page.getByRole('region', { name: 'Disimpan' });
  await expect(saved.getByRole('heading', { name: 'Surat untuk Ibu' })).toBeVisible();

  await saved.getByRole('button', { name: 'Hapus dari Rak: Surat untuk Ibu' }).click();
  await expect(saved.getByText('Belum ada cerita yang disimpan.', { exact: false })).toBeVisible();
  expect(await storage(page, SHELF_KEY)).toEqual([]);
});

test('lists reading history and clears it after confirmation', async ({ page }) => {
  await page.goto('/cerita/hujan-di-stasiun-terakhir/rumah-di-jalan-kenari');
  await expect.poll(() => storage(page, PROGRESS_KEY)).not.toBeNull();

  await page.goto('/rak');
  const history = page.getByRole('region', { name: 'Riwayat baca' });
  const item = history.getByRole('link', { name: 'Lanjutkan: Hujan di Stasiun Terakhir' });
  await expect(item).toHaveAttribute(
    'href',
    '/cerita/hujan-di-stasiun-terakhir/rumah-di-jalan-kenari',
  );
  await expect(item).toContainText('Bab 2 dari 2');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Hapus riwayat baca' }).click();
  await expect(page.getByRole('status')).toHaveText('Riwayat baca sudah dihapus.');
  await expect(history.getByText('Belum ada riwayat baca.')).toBeVisible();
  expect(await storage(page, PROGRESS_KEY)).toBeNull();
});

test('exports all reader data as JSON', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '["surat-untuk-ibu"]'), SHELF_KEY);
  await page.goto('/rak');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Ekspor data' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^singgah-baca-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(backup).toMatchObject({ app: 'singgah-baca', version: 1, shelf: ['surat-untuk-ibu'] });
});

test('imports a backup and applies it', async ({ page }) => {
  await page.goto('/rak');
  await page.locator('input[type="file"]').setInputFiles(
    backupFile({
      app: 'singgah-baca',
      version: 1,
      exportedAt: '2026-09-24T10:00:00Z',
      preferences: { theme: 'night' },
      progress: {},
      shelf: ['hujan-di-stasiun-terakhir'],
    }),
  );
  await expect(page.getByRole('status')).toHaveText('Data berhasil diimpor.');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await expect(
    page.getByRole('region', { name: 'Disimpan' }).getByRole('heading', {
      name: 'Hujan di Stasiun Terakhir',
    }),
  ).toBeVisible();
});

test('rejects a file that is not a backup and keeps existing data', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '["surat-untuk-ibu"]'), SHELF_KEY);
  await page.goto('/rak');
  await page.locator('input[type="file"]').setInputFiles(backupFile('{"bukan": "cadangan"}'));
  await expect(page.getByRole('status')).toHaveText(
    'File tidak dapat dibaca. Pastikan file berasal dari menu Ekspor Singgah Baca.',
  );
  expect(await storage(page, SHELF_KEY)).toEqual(['surat-untuk-ibu']);
});

test('the shelf page is kept out of search results', async ({ page }) => {
  await page.goto('/rak');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

for (const scheme of ['light', 'dark'] as const) {
  test(`has no accessibility violations with data (${scheme})`, async ({ page }) => {
    await page.addInitScript(
      ([shelfKey, progressKey]) => {
        localStorage.setItem(shelfKey, '["surat-untuk-ibu"]');
        localStorage.setItem(
          progressKey,
          JSON.stringify({
            'hujan-di-stasiun-terakhir': {
              chapter: 'kereta-yang-terlambat',
              order: 1,
              paragraph: 0,
              offset: 0,
              at: '2026-09-24T10:00:00Z',
            },
          }),
        );
      },
      [SHELF_KEY, PROGRESS_KEY],
    );
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/rak');
    await expect(page.getByRole('heading', { name: 'Surat untuk Ibu' })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
