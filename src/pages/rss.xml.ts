import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { formatChapterPosition, t } from '../i18n/id';
import { getStories } from '../lib/stories';

const MAX_ITEMS = 50;

/** New stories and new novel chapters, newest first. */
export const GET: APIRoute = async ({ site }) => {
  const stories = await getStories();
  const items = stories.flatMap((story) => {
    const storyUrl = `/cerita/${story.slug}`;
    const storyItem = {
      title: story.data.title,
      link: storyUrl,
      pubDate: story.data.publishedAt,
      description: story.data.synopsis,
      categories: [t.category[story.data.category]],
    };
    if (story.data.category !== 'novel') return [storyItem];

    // Chapter 1 arrives with the story itself; later dated chapters get their own item.
    const laterChapters = story.chapters
      .filter((chapter) => chapter.order > 1 && chapter.publishedAt)
      .map((chapter) => ({
        title: `${story.data.title}: ${chapter.title}`,
        link: `${storyUrl}/${chapter.slug}`,
        pubDate: chapter.publishedAt!,
        description: `${formatChapterPosition(chapter.order, story.chapters.length)} · ${story.data.title}`,
        categories: [t.category.novel],
      }));
    return [storyItem, ...laterChapters];
  });

  return rss({
    title: t.site.name,
    description: t.site.description,
    site: site!,
    items: items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()).slice(0, MAX_ITEMS),
    customData: '<language>id</language>',
    // Site URLs never end in a slash.
    trailingSlash: false,
  });
};
