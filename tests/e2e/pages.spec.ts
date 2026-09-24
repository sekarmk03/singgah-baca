import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { path: '/', heading: 'Semua cerita' },
  { path: '/cerita/hujan-di-stasiun-terakhir', heading: 'Hujan di Stasiun Terakhir' },
  {
    path: '/cerita/hujan-di-stasiun-terakhir/kereta-yang-terlambat',
    heading: 'Kereta yang Terlambat',
  },
  { path: '/cerita/surat-untuk-ibu', heading: 'Surat untuk Ibu' },
  { path: '/cerita/surat-untuk-ibu/baca', heading: 'Surat untuk Ibu' },
  { path: '/genre/keluarga', heading: 'Genre Keluarga' },
  { path: '/penulis/laras-wening', heading: 'Laras Wening' },
];

for (const { path, heading } of pages) {
  test.describe(path, () => {
    test('renders its heading in Indonesian', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'id');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    });

    test('has no horizontal scroll', async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    for (const scheme of ['light', 'dark'] as const) {
      test(`has no accessibility violations (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test('links chapters in order and marks the end of an ongoing novel', async ({ page }) => {
  await page.goto('/cerita/hujan-di-stasiun-terakhir/kereta-yang-terlambat');
  await page.getByRole('link', { name: 'Bab berikutnya →' }).click();
  await expect(page).toHaveURL(/\/rumah-di-jalan-kenari$/);
  await expect(page.getByText('Bab 2 dari 2')).toBeVisible();
  await expect(page.getByText('Bersambung', { exact: true })).toBeVisible();
});

test('serves a 404 page for unknown stories', async ({ page }) => {
  const response = await page.goto('/cerita/tidak-ada');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Halaman tidak ditemukan');
});
