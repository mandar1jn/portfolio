import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	site: "https://marijnkneppers.dev",
	integrations: [sitemap(), tailwind()],
	output: "static",
	markdown: {
		syntaxHighlight: false,
	},
	build: {
		inlineStylesheets: "auto",
	},
	experimental: {
		assets: true,
	},
	image: {
		service: {
			entrypoint: "astro/assets/services/sharp",
		},
	}
});