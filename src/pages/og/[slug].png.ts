import type { APIRoute, GetStaticPaths } from 'astro';
import { t } from '../../i18n/id';
import { renderOgImage, type OgImageText } from '../../lib/og-image';
import { getStories } from '../../lib/stories';

/** One image per story, plus `default` for every other page. */
export const getStaticPaths = (async () => {
  const stories = await getStories();
  const site: OgImageText = {
    title: t.site.name,
    subtitle: t.site.description,
    siteName: t.site.name,
  };
  return [
    { params: { slug: 'default' }, props: { text: site } },
    ...stories.map((story) => ({
      params: { slug: story.slug },
      props: {
        text: {
          title: story.data.title,
          subtitle: `${t.story.by} ${story.author.data.name}`,
          footer: `${t.category[story.data.category]} · ${t.status[story.data.status]}`,
          siteName: t.site.name,
        } satisfies OgImageText,
      },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ text: OgImageText }> = async ({ props }) => {
  const png = await renderOgImage(props.text);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
