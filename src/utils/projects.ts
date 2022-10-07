import type { MarkdownInstance } from "astro";

export type ProjectFrontMatter = {
	title: string;
	description: string;
	imgSrc: string;
	imgAlt: string;
	pubDate: string;
	tags: string[];
}

export const sortProjectsByDate = (projects: MarkdownInstance<ProjectFrontMatter>[]) => {
	return projects.sort(
	  (a, b) =>
		new Date(b.frontmatter.pubDate).valueOf() -
		new Date(a.frontmatter.pubDate).valueOf()
	);
  };