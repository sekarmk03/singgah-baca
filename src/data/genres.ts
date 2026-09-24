/** Official genre list. Story frontmatter may only reference these slugs. */
export const genres = [
  { slug: 'drama', name: 'Drama' },
  { slug: 'romansa', name: 'Romansa' },
  { slug: 'misteri', name: 'Misteri' },
  { slug: 'keluarga', name: 'Keluarga' },
  { slug: 'fantasi', name: 'Fantasi' },
  { slug: 'horor', name: 'Horor' },
  { slug: 'komedi', name: 'Komedi' },
  { slug: 'sejarah', name: 'Sejarah' },
] as const;

export type GenreSlug = (typeof genres)[number]['slug'];

export const genreSlugs = genres.map((genre) => genre.slug) as [GenreSlug, ...GenreSlug[]];

export function getGenreName(slug: GenreSlug): string {
  return genres.find((genre) => genre.slug === slug)?.name ?? slug;
}
