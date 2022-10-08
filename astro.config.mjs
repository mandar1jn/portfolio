import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import image from "@astrojs/image";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://marijnkneppers.dev",
  integrations: [sitemap(), image({
    serviceEntryPoint: '@astrojs/image/sharp'
  }), tailwind()],
  output: "static",
  markdown: {
	syntaxHighlight: false
  }
});