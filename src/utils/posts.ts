import type { CollectionEntry } from "astro:content";

export const sortPostsByDate = (posts: CollectionEntry<'blog'>[]) => {
	return posts.sort(
	  (a, b) =>
		new Date(b.data.pubDate).valueOf() -
		new Date(a.data.pubDate).valueOf()
	);
  };