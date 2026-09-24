import { expect, test } from '@playwright/test';

function jsonLd(page: import('@playwright/test').Page) {
  return page
    .locator('script[type="application/ld+json"]')
    .textContent()
    .then((text) => JSON.parse(text!));
}

test('story pages describe themselves for search engines and social previews', async ({ page }) => {
  await page.goto('/cerita/hujan-di-stasiun-terakhir');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'book');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https?:\/\/.+\/og\/hujan-di-stasiun-terakhir\.png$/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  expect(await jsonLd(page)).toMatchObject({
    '@type': 'Book',
    name: 'Hujan di Stasiun Terakhir',
    author: { '@type': 'Person', name: 'Laras Wening' },
    inLanguage: 'id',
    numberOfChapters: 2,
  });

  await page.goto('/cerita/hujan-di-stasiun-terakhir/rumah-di-jalan-kenari');
  expect(await jsonLd(page)).toMatchObject({
    '@type': 'Chapter',
    name: 'Rumah di Jalan Kenari',
    position: 2,
    isPartOf: { '@type': 'Book', name: 'Hujan di Stasiun Terakhir' },
  });

  await page.goto('/cerita/surat-untuk-ibu');
  expect(await jsonLd(page)).toMatchObject({ '@type': 'ShortStory', name: 'Surat untuk Ibu' });
});

test('social preview images are PNGs', async ({ request }) => {
  for (const path of ['/og/default.png', '/og/surat-untuk-ibu.png']) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('image/png');
  }
});

test('robots.txt points to the sitemap, which lists content but not the shelf', async ({
  request,
}) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/^User-agent: \*$/m);
  expect(robots).toMatch(/^Sitemap: https?:\/\/.+\/sitemap-index\.xml$/m);

  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('/cerita/hujan-di-stasiun-terakhir</loc>');
  expect(sitemap).toContain('/genre/keluarga</loc>');
  expect(sitemap).not.toContain('/rak</loc>');
  expect(sitemap).not.toContain('/404');
});

test('the RSS feed lists stories and new chapters in Indonesian', async ({ request }) => {
  const response = await request.get('/rss.xml');
  expect(response.ok()).toBe(true);
  const feed = await response.text();
  expect(feed).toContain('<language>id</language>');
  expect(feed).toContain('<title>Hujan di Stasiun Terakhir: Rumah di Jalan Kenari</title>');
  expect(feed).toContain('<title>Surat untuk Ibu</title>');
  // Links follow the site's no-trailing-slash URLs.
  expect(feed).not.toMatch(/<link>[^<]+\/<\/link>/);
});
