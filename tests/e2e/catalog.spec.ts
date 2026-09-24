import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { dummyEntries } from '../fixtures/catalog';

const PROGRESS_KEY = 'singgah-baca:v1:progress';

const isMobile = (page: Page) => page.viewportSize()!.width < 960;

/** Genre checkboxes live in the sidebar on desktop and in the filter sheet on smaller screens. */
async function openFilters(page: Page) {
  if (isMobile(page)) {
    await page.getByRole('button', { name: /^Filter/ }).click();
    await expect(page.getByRole('dialog', { name: 'Filter' })).toBeVisible();
  }
}

async function closeFilters(page: Page) {
  if (isMobile(page)) {
    await page.getByRole('button', { name: /^Tampilkan/ }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  }
}

function resultCount(page: Page) {
  return page.locator('.catalog__count');
}

function cards(page: Page) {
  return page.locator('.catalog__grid .story-card');
}

test.describe('filters restored from the URL', () => {
  const cases = [
    {
      url: '/?q=hujan&kategori=novel&genre=drama,misteri&urut=terbaru',
      count: '1 cerita',
      titles: ['Hujan di Stasiun Terakhir'],
    },
    { url: '/?kategori=cerpen', count: '1 cerita', titles: ['Surat untuk Ibu'] },
    { url: '/?genre=keluarga&status=tamat', count: '1 cerita', titles: ['Surat untuk Ibu'] },
    { url: '/?penulis=laras-wening&durasi=pendek', count: '2 cerita', titles: [] },
    {
      url: '/?urut=judul',
      count: '2 cerita',
      titles: ['Hujan di Stasiun Terakhir', 'Surat untuk Ibu'],
    },
  ];

  for (const { url, count, titles } of cases) {
    test(url, async ({ page }) => {
      await page.goto(url);
      await expect(resultCount(page)).toHaveText(count);
      if (titles.length) {
        await expect(cards(page).locator('h2')).toHaveText(titles);
      }
      // The URL is kept as-is (already canonical), so it can be shared.
      expect(new URL(page.url()).search).toBe(new URL(url, 'http://x').search);
    });
  }

  test('restores every control', async ({ page }) => {
    await page.goto('/?q=hujan&kategori=novel&genre=drama&urut=judul');
    await expect(page.getByRole('searchbox', { name: /Cari judul/ })).toHaveValue('hujan');
    await expect(page.getByRole('button', { name: 'Novel (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('combobox', { name: 'Urutkan' })).toHaveValue('title');
    await openFilters(page);
    await expect(page.getByRole('checkbox', { name: 'Drama (1)' })).toBeChecked();
  });
});

test('searching and filtering update the URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: /Cari judul/ }).fill('surat');
  await expect(resultCount(page)).toHaveText('1 cerita');
  await expect(page).toHaveURL(/\?q=surat$/);

  await page.getByRole('searchbox', { name: /Cari judul/ }).fill('');
  await openFilters(page);
  await page.getByRole('checkbox', { name: /^Drama/ }).check();
  await closeFilters(page);
  await expect(page).toHaveURL(/\?genre=drama$/);
  await expect(resultCount(page)).toHaveText('1 cerita');

  await page.getByRole('button', { name: 'Hapus filter Drama' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(resultCount(page)).toHaveText('2 cerita');
});

test('shows an empty state with a way out', async ({ page }) => {
  await page.goto('/?genre=horor');
  await expect(
    page.getByText('Tidak ada cerita yang cocok. Coba kurangi filter atau ubah kata kunci.'),
  ).toBeVisible();
  await page.locator('.catalog__empty').getByRole('button', { name: 'Hapus semua filter' }).click();
  await expect(resultCount(page)).toHaveText('2 cerita');
});

test('dims options with no results', async ({ page }) => {
  await page.goto('/?kategori=cerpen');
  await openFilters(page);
  await expect(page.locator('.filter-option', { hasText: 'Drama (0)' })).toHaveClass(/is-empty/);
  await expect(page.locator('.filter-option', { hasText: 'Keluarga (1)' })).not.toHaveClass(
    /is-empty/,
  );
});

test('the filter sheet opens, closes and returns focus on small screens', async ({ page }) => {
  test.skip(!isMobile(page), 'The sidebar replaces the sheet on desktop.');
  await page.goto('/');
  const opener = page.getByRole('button', { name: /^Filter/ });
  await opener.click();
  const sheet = page.getByRole('dialog', { name: 'Filter' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('checkbox', { name: /^Keluarga/ }).check();
  await expect(sheet.getByRole('button', { name: 'Tampilkan 2 cerita' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(opener).toHaveText('Filter (1)');
});

test('filtered views are hidden from search engines', async ({ page }) => {
  await page.goto('/?genre=keluarga');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/genre\/keluarga$/);

  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test('Back returns to the same filtered list', async ({ page }) => {
  await page.goto('/?kategori=cerpen');
  await expect(resultCount(page)).toHaveText('1 cerita');
  await cards(page).getByRole('link', { name: 'Surat untuk Ibu' }).click();
  await expect(page).toHaveURL(/\/cerita\/surat-untuk-ibu$/);
  await page.goBack();
  await expect(page).toHaveURL(/\?kategori=cerpen$/);
  await expect(resultCount(page)).toHaveText('1 cerita');
});

test('continue reading appears for stories with progress', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        'hujan-di-stasiun-terakhir': {
          chapter: 'rumah-di-jalan-kenari',
          order: 2,
          paragraph: 4,
          offset: 0.2,
          at: '2026-09-24T10:00:00Z',
        },
        'cerita-yang-dihapus': {
          chapter: 'bab',
          paragraph: 0,
          offset: 0,
          at: '2026-09-25T10:00:00Z',
        },
      }),
    );
  }, PROGRESS_KEY);
  // Hold the index back so the page can be measured before the section renders.
  let releaseIndex = () => {};
  const indexHeld = new Promise<void>((resolve) => (releaseIndex = resolve));
  await page.route('**/search-index.json', async (route) => {
    await indexHeld;
    await route.continue();
  });

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-has-progress', '');
  // Space is reserved before the section renders, so the list below must not move.
  const listTop = () =>
    page.locator('.catalog__layout').evaluate((element) => element.getBoundingClientRect().top);
  const before = await listTop();
  releaseIndex();
  const section = page.getByRole('region', { name: 'Lanjutkan membaca' });
  await expect(section.getByRole('link')).toHaveCount(1);
  await expect(section.getByRole('link')).toHaveAttribute(
    'href',
    '/cerita/hujan-di-stasiun-terakhir/rumah-di-jalan-kenari',
  );
  await expect(cards(page).first()).toContainText('Bab 2 dari 2');
  expect(await listTop()).toBe(before);
});

test.describe('with 1.000 stories', () => {
  test.beforeEach(async ({ page }) => {
    const entries = dummyEntries(1000);
    await page.route('**/search-index.json', (route) => route.fulfill({ json: entries }));
  });

  test('pages through results with "Muat lebih banyak"', async ({ page }) => {
    await page.goto('/?hal=2');
    await expect(cards(page)).toHaveCount(48);
    await page.getByRole('button', { name: 'Muat lebih banyak' }).click();
    await expect(cards(page)).toHaveCount(72);
    await expect(page).toHaveURL(/\?hal=3$/);
    // Keyboard focus moves to the first newly loaded story.
    await expect(cards(page).nth(48).getByRole('link')).toBeFocused();
  });

  test('updates results within 50 ms of a filter change', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || isMobile(page), 'Timed once, on desktop Chromium.');
    await page.goto('/');
    await expect(resultCount(page)).toHaveText('1.000 cerita');

    const elapsed = await page.evaluate(async () => {
      const count = document.querySelector('.catalog__count')!;
      const before = count.textContent;
      const checkbox = [...document.querySelectorAll<HTMLLabelElement>('.filter-option')]
        .find((label) => label.textContent?.startsWith('Misteri'))!
        .querySelector('input')!;
      const start = performance.now();
      checkbox.click();
      await new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (count.textContent !== before) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(count, { childList: true, characterData: true, subtree: true });
      });
      return performance.now() - start;
    });
    expect(elapsed).toBeLessThan(50);
  });
});

test('works when localStorage is blocked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
  });
  await page.goto('/?kategori=novel');
  await expect(resultCount(page)).toHaveText('1 cerita');
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`has no accessibility violations with filters open (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?genre=keluarga&status=tamat');
    await expect(resultCount(page)).toHaveText('1 cerita');
    await openFilters(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
