import { defineCollection } from "astro:content"
import { z } from "astro/zod"
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/blog" }),
	schema: ({ image }) => z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		imgSrc: image(),
		imgAlt: z.string(),
	})
})

const projects = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/projects" }),
	schema: ({ image }) => z.object({
		title: z.string(),
		description: z.string(),
		imgSrc: image(),
		imgAlt: z.string(),
		pubDate: z.coerce.date(),
		tags: z.string().array()
	})
})

export const collections = {
	blog: blog,
	projects: projects
}