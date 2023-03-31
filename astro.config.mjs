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
	experimental: {
		assets: true
	},
	image: {
		service: "astro/assets/services/sharp",
	}
});