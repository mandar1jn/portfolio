import { z, defineCollection } from "astro:content"



const blog = defineCollection({
	schema: {
		title: z.string(),
		description: z.string(),
		pubDate: z.preprocess((arg) => {
			if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
		  }, z.date()),
		imgSrc: z.string(),
		imgAlt: z.string(),
		draft: z.boolean().optional()
	}
})

export const collections = {
	blog: blog
}