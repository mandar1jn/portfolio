import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import image from "@astrojs/image";
import tailwind from "@astrojs/tailwind";
import remarkGfm from 'remark-gfm';

// https://astro.build/config
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
	site: "https://marijnkneppers.dev",
	integrations: [sitemap(), image({
		serviceEntryPoint: '@astrojs/image/sharp'
	}), tailwind(), mdx()],
	output: "static",
	markdown: {
		syntaxHighlight: false,
	}
});