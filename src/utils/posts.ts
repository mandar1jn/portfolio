import type { MarkdownInstance } from "astro";

export type PostFrontMatter = {
	title: string;
	description: string;
	pubDate: string;
	imgSrc: string;
	imgAlt: string;
}

export const sortByDate = (posts: MarkdownInstance<PostFrontMatter>[]) => {
	return posts.sort(
	  (a, b) =>
		new Date(b.frontmatter.pubDate).valueOf() -
		new Date(a.frontmatter.pubDate).valueOf()
	);
  };