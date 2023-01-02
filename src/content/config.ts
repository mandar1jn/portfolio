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

const projects = defineCollection({
	schema: {
		title: z.string(),
		description: z.string(),
		imgSrc: z.string(),
		imgAlt: z.string(),
		pubDate: z.preprocess((arg) => {
			if(typeof arg == "string" || arg instanceof Date) return new Date(arg)
		}, z.date()),
		tags: z.string().array()
	}
})

export const collections = {
	blog: blog,
	projects: projects
}