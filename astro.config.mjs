import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import rehypeGlossaryLinks from "./src/lib/rehype-glossary-links.mjs";
import { lastmodFor } from "./src/lib/content-dates.mjs";

// 静的出力（ConoHa VPS + Nginx で dist/ を配信）
export default defineConfig({
  site: "https://toushi-manabiya.jp",
  output: "static",
  integrations: [
    mdx(),
    sitemap({
      // lastmod を出す（更新検知＝再クロールの手がかり。既定では出力されない）。
      // 日付は frontmatter の updated が唯一の出所で、ビルド時刻は使わない
      // （毎回のデプロイで全URLが「更新された」ことになり、シグナルとして無意味になるため）。
      serialize(item) {
        const d = lastmodFor(item.url);
        if (d) item.lastmod = d.toISOString();
        return item;
      },
    }),
  ],
  build: { format: "directory" },
  markdown: {
    // 本文中の用語（初出・最大5件）を用語集へ自動リンク（WO-TOUSHI-002(a)）
    rehypePlugins: [rehypeGlossaryLinks],
  },
});
