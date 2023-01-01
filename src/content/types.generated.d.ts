declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type CollectionEntry<C extends keyof typeof entryMap> =
		typeof entryMap[C][keyof typeof entryMap[C]] & Render;

	type BaseCollectionConfig<S extends import('astro/zod').ZodRawShape> = {
		schema?: S;
		slug?: (entry: {
			id: CollectionEntry<keyof typeof entryMap>['id'];
			defaultSlug: string;
			collection: string;
			body: string;
			data: import('astro/zod').infer<import('astro/zod').ZodObject<S>>;
		}) => string | Promise<string>;
	};
	export function defineCollection<S extends import('astro/zod').ZodRawShape>(
		input: BaseCollectionConfig<S>
	): BaseCollectionConfig<S>;

	export function getEntry<C extends keyof typeof entryMap, E extends keyof typeof entryMap[C]>(
		collection: C,
		entryKey: E
	): Promise<typeof entryMap[C][E] & Render>;
	export function getCollection<
		C extends keyof typeof entryMap,
		E extends keyof typeof entryMap[C]
	>(
		collection: C,
		filter?: (data: typeof entryMap[C][E]) => boolean
	): Promise<(typeof entryMap[C][E] & Render)[]>;

	type InferEntrySchema<C extends keyof typeof entryMap> = import('astro/zod').infer<
		import('astro/zod').ZodObject<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type Render = {
		render(): Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			injectedFrontmatter: Record<string, any>;
		}>;
	};

	const entryMap: {
		"blog": {
"creating-my-portfolio-website-with-astro.md": {
  id: "creating-my-portfolio-website-with-astro.md",
  slug: "creating-my-portfolio-website-with-astro",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"dissecting-the-skylanders-portal-part1.md": {
  id: "dissecting-the-skylanders-portal-part1.md",
  slug: "dissecting-the-skylanders-portal-part1",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"dissecting-the-skylanders-portal-part2.md": {
  id: "dissecting-the-skylanders-portal-part2.md",
  slug: "dissecting-the-skylanders-portal-part2",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"dissecting-the-skylanders-portal-part3.md": {
  id: "dissecting-the-skylanders-portal-part3.md",
  slug: "dissecting-the-skylanders-portal-part3",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"dissecting-the-skylanders-portal-part4.md": {
  id: "dissecting-the-skylanders-portal-part4.md",
  slug: "dissecting-the-skylanders-portal-part4",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"some-big-skylanders-discoveries.md": {
  id: "some-big-skylanders-discoveries.md",
  slug: "some-big-skylanders-discoveries",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
},

	};

	type ContentConfig = typeof import("./config");
}
