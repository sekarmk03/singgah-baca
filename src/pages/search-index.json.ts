import type { APIRoute } from 'astro';
import { toCatalogEntry } from '../lib/catalog-entry';
import { getStories } from '../lib/stories';

/** Catalog data for client-side search and filtering, generated at build time. */
export const GET: APIRoute = async () => {
  const entries = (await getStories()).map(toCatalogEntry);
  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
