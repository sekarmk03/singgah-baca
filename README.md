# Singgah Baca

A static library of Indonesian short stories and novels, built with Astro and deployed to Vercel.
There is no backend: every page is generated at build time from Markdown files.

## Requirements

- Node.js 22.12 or newer (see `.nvmrc`)

## Commands

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Start the dev server at `http://localhost:4321`     |
| `npm run build`    | Build the static site into `dist/`                  |
| `npm run preview`  | Serve `dist/` locally                               |
| `npm run check`    | Type-check `.astro` and `.ts` files                 |
| `npm run lint`     | Run ESLint                                          |
| `npm run format`   | Format all files with Prettier                      |
| `npm test`         | Run unit tests (Vitest)                             |
| `npm run test:e2e` | Run browser and accessibility tests (needs a build) |

## Adding a story

Each story is a folder in `src/content/stories/`:

```
src/content/stories/hujan-di-stasiun-terakhir/
  index.md                      # metadata + synopsis
  01-kereta-yang-terlambat.md   # chapter 1
  02-rumah-di-jalan-kenari.md   # chapter 2
```

- The folder name is the story URL: `/cerita/hujan-di-stasiun-terakhir`.
- Chapter order comes only from the number prefix in the file name.
- A novel chapter's URL is its file name without the prefix. Set `slug` in the chapter frontmatter
  before renaming a published file so old links keep working.
- A short story (`category: short-story`) has exactly one chapter, served at `/cerita/[slug]/baca`.
- `draft: true` on a story or a chapter hides it from production builds.
- Authors live in `src/content/authors/*.md`; genres are listed in `src/data/genres.ts`.

Invalid frontmatter, unknown authors or genres, and duplicate chapter numbers or slugs fail the
build with an error that names the file.

## Conventions

- All user-facing text is proper Indonesian and lives in `src/i18n/id.ts`.
- All code (identifiers, file names, comments, data values) is in English. Page files under
  `src/pages/` are the exception because their names become Indonesian URLs.

## Deploying to Vercel

1. Import this repository in Vercel. The Astro preset is detected automatically.
2. Build command `npm run build`, output directory `dist`.
3. Every branch and pull request gets a preview URL; `main` is production.

`vercel.json` sets clean URLs without trailing slashes and long-lived caching for `/_astro/` assets.
