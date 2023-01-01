import { z, defineCollection } from "astro:content"

const blog = defineCollection({
	schema: {
		title: z.string(),
		description: z.string(),
		// add .datetime() and fix later
		pubDate: z.string(),
		imgSrc: z.string(),
		imgAlt: z.string(),
		draft: z.boolean().optional()
	}
})

export const collections = {
	blog: blog
}