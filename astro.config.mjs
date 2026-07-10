import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import rehypeGlossaryLinks from "./src/lib/rehype-glossary-links.mjs";

// 静的出力（ConoHa VPS + Nginx で dist/ を配信）
export default defineConfig({
  site: "https://toushi-manabiya.jp",
  output: "static",
  integrations: [mdx(), sitemap()],
  build: { format: "directory" },
  markdown: {
    // 本文中の用語（初出・最大5件）を用語集へ自動リンク（WO-TOUSHI-002(a)）
    rehypePlugins: [rehypeGlossaryLinks],
  },
});
