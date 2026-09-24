// @ts-check
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// Vercel exposes the production domain at build time; fall back to localhost for local builds.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: productionHost ? `https://${productionHost}` : 'http://localhost:4321',
  output: 'static',
  integrations: [
    preact(),
    sitemap({
      // The shelf is private to each browser and the 404 page is not content.
      filter: (page) => !/\/(rak|404)$/.test(new URL(page).pathname),
    }),
  ],
  trailingSlash: 'never',
  build: {
    // Emit `/cerita/foo.html` instead of `/cerita/foo/index.html` so URLs never need a trailing slash.
    format: 'file',
  },
});
