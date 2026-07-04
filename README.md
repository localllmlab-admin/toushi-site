# 投資・トレード教育情報サイト

Astro 製の静的サイト。ConoHa VPS + Nginx 配信、Hermes agent 自律運用前提。
**まず `BUILD_SPEC.md` と `CLAUDE.md` を読むこと。**

## セットアップ
```bash
npm install
npm run validate   # コンプラ・品質リンター
npm run dev        # 開発サーバー
npm run build      # 本番ビルド（astro build + pagefind）
```

## 本番デプロイ（VPS）
1. astro.config.mjs の `site` を実ドメインに変更し、`sitemap()` を integrations に追加
2. `ops/deploy.sh` を cron / post-merge hook / Claude Code から実行
3. Nginx は `nginx.conf.sample` を参照（root=dist）

## 安全機構（検証済み）
- 免責は Article.astro が全記事末に機械挿入（frontmatter で消せない）
- sources 空はビルド失敗（Zod）
- reviewed:false は本番から除外
- ops/validate_content.mjs が「必ず儲かる」「100%」「インサイダー示唆」等を検出しCIで停止
