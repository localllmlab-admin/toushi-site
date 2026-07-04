import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// 静的出力（ConoHa VPS + Nginx で dist/ を配信）
export default defineConfig({
  site: "https://example.jp", // 本番ドメインに置換
  output: "static",
  integrations: [mdx()], // 本番: sitemap() を追加し site を実ドメインに設定
  build: { format: "directory" },
});
