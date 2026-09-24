/**
 * Social preview images (1200 × 630) generated at build time with Satori, for stories without a
 * cover and for the site itself. Build-time only: reads font files from node_modules.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Same palette as the "paper" theme tokens.
const COLORS = { background: '#efe9da', text: '#3a342b', muted: '#655c50', accent: '#7c2e2e' };
const FONT_DIR = join(process.cwd(), 'node_modules/@fontsource/literata/files');

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 600 }[]> | undefined;

function loadFonts() {
  // Satori reads WOFF (not WOFF2).
  fontsPromise ??= Promise.all([
    readFile(join(FONT_DIR, 'literata-latin-400-normal.woff')),
    readFile(join(FONT_DIR, 'literata-latin-600-normal.woff')),
  ]).then(([regular, semibold]) => [
    { name: 'Literata', data: regular, weight: 400 as const },
    { name: 'Literata', data: semibold, weight: 600 as const },
  ]);
  return fontsPromise;
}

export interface OgImageText {
  title: string;
  /** Line under the title, e.g. "oleh Laras Wening". */
  subtitle?: string;
  /** Small line at the bottom, e.g. "Novel · Bersambung". */
  footer?: string;
  siteName: string;
}

/** Longer titles get a smaller size so they stay within three lines. */
function titleSize(title: string): number {
  if (title.length <= 24) return 84;
  if (title.length <= 48) return 68;
  return 54;
}

export async function renderOgImage(text: OgImageText): Promise<Uint8Array<ArrayBuffer>> {
  const element = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 96px',
        background: COLORS.background,
        color: COLORS.text,
        fontFamily: 'Literata',
        position: 'relative',
      },
      children: [
        // Bookmark ribbon, as in the reader.
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              right: 96,
              width: 44,
              height: 150,
              background: COLORS.accent,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', maxWidth: 900 },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: titleSize(text.title), fontWeight: 600, lineHeight: 1.15 },
                  children: text.title,
                },
              },
              text.subtitle && {
                type: 'div',
                props: {
                  style: { marginTop: 28, fontSize: 38, color: COLORS.muted },
                  children: text.subtitle,
                },
              },
            ].filter(Boolean),
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', justifyContent: 'space-between', fontSize: 30 },
            children: [
              { type: 'div', props: { style: { fontWeight: 600 }, children: text.siteName } },
              {
                type: 'div',
                props: { style: { color: COLORS.muted }, children: text.footer ?? '' },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(element as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  });
  // Copy into a plain ArrayBuffer-backed array, which is what `Response` accepts.
  return new Uint8Array(
    new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng(),
  );
}
