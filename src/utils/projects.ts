import type { CollectionEntry } from "astro:content";

export const sortProjectsByDate = (projects: CollectionEntry<"projects">[]) => {
	return projects.sort(
	  (a, b) =>
		b.data.pubDate.valueOf() -
		a.data.pubDate.valueOf()
	);
  };