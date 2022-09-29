import type { MarkdownInstance } from "astro";

export type FrontMatter = {
	title: string;
	description: string;
	pubDate: string;
	imgSrc: string;
	imgAlt: string;
}

export const sortByDate = (posts: MarkdownInstance<FrontMatter>[]) => {
	return posts.sort(
	  (a, b) =>
		new Date(b.frontmatter.pubDate).valueOf() -
		new Date(a.frontmatter.pubDate).valueOf()
	);
  };