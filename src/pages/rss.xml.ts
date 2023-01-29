import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

const posts = await getCollection('blog', ({ data }) => {
	if(import.meta.env.PROD)
		return data.draft != true;
	return true;
});

export const get = () => rss({
  // `<title>` field in output xml
  title: 'Marijn Kneppers\' Blog',
  // `<description>` field in output xml
  description: 'My blog where I write about my projects and interests',
  // base URL for RSS <item> links
  // SITE will use "site" from your project's astro.config.
  site: import.meta.env.SITE,
  // list of `<item>`s in output xml
  // simple example: generate items for every md file in /src/pages
  // see "Generating items" section for required frontmatter and advanced use cases
  items: posts.map((post) => ({
    link: "/posts/" + post.slug,
    title: post.data.title,
    pubDate: post.data.pubDate,
  })),
  // (optional) inject custom xml
  customData: `<language>en-us</language>`,
});