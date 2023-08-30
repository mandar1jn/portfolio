import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	site: "https://marijnkneppers.dev",
	integrations: [sitemap(), tailwind()],
	output: "static",
	trailingSlash: 'ignore',
	markdown: {
		syntaxHighlight: false,
	}
});