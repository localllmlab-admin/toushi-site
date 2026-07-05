import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// 静的出力（ConoHa VPS + Nginx で dist/ を配信）
export default defineConfig({
  site: "https://toushi-manabiya.jp",
  output: "static",
  integrations: [mdx(), sitemap()],
  build: { format: "directory" },
});
