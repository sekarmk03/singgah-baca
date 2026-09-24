// @ts-check
import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

// Vercel exposes the production domain at build time; fall back to localhost for local builds.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: productionHost ? `https://${productionHost}` : 'http://localhost:4321',
  output: 'static',
  integrations: [preact()],
  trailingSlash: 'never',
  build: {
    // Emit `/cerita/foo.html` instead of `/cerita/foo/index.html` so URLs never need a trailing slash.
    format: 'file',
  },
});
