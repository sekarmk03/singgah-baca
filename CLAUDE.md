# Singgah Baca

Static Astro site (no backend) for reading Indonesian stories. The product spec lives in the
"Plan & Spec: Singgah Baca" doc; follow its phases.

## Language rules

- Every user-facing string (labels, messages, titles, meta descriptions, alt text, `aria-label`,
  URL segments and query params) must be proper Indonesian (EYD V / KBBI). Use English only where it
  is the more natural term (JSON, RSS, email, "Aa").
- UI strings live only in `src/i18n/id.ts` (English keys, Indonesian values). Format dates and
  numbers with the helpers there (`id-ID` locale).
- All code is English: identifiers, file and folder names, comments, CSS classes, frontmatter
  fields, enum values (`short-story`, `completed`), localStorage keys (`singgah-baca:v1:*`).
- Exceptions: file names under `src/pages/` follow the Indonesian routes, and content slugs
  (stories, chapters, authors, genres) stay Indonesian.

## Checks before pushing

`npm run format:check && npm run lint && npm run check && npm test && npm run build && npm run test:e2e`

In cloud sandboxes, run Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`.
