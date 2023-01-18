import { z, defineCollection } from "astro:content"



const blog = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		imgSrc: z.string(),
		imgAlt: z.string(),
		draft: z.boolean().optional()
	})
})

const projects = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
		imgSrc: z.string(),
		imgAlt: z.string(),
		pubDate: z.coerce.date(),
		tags: z.string().array()
	})
})

export const collections = {
	blog: blog,
	projects: projects
}