/** Stories the reader saved to their shelf, persisted under `singgah-baca:v1:shelf`. */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type Shelf = string[];

/** Keeps unique, well-formed story slugs from untrusted stored data. */
export function sanitizeShelf(raw: unknown): Shelf {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw.filter((slug): slug is string => typeof slug === 'string' && SLUG_PATTERN.test(slug)),
    ),
  ];
}

/** Adds a story to the front of the shelf, or removes it when already saved. */
export function toggleShelf(shelf: Shelf, slug: string): Shelf {
  return shelf.includes(slug) ? shelf.filter((item) => item !== slug) : [slug, ...shelf];
}
