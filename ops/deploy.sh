#!/usr/bin/env bash
# ConoHa VPS デプロイ。post-merge や cron / Claude Code から実行。
set -euo pipefail
REPO_DIR="${REPO_DIR:-/var/www/toushi-site}"

cd "$REPO_DIR"
git pull --ff-only
npm ci
npm run validate          # コンプラ・品質・鮮度リンター（失敗したら公開しない）
npm run build             # astro build + pagefind

# SEO機械検査。dist が要るのでビルド後に走らせる。
# ここで落としてもビルド済みの dist は既に入れ替わっており巻き戻せないため、
# デプロイは止めずに「気づける形」で残す（validate と違いゲートではない）。
npm run seo || echo "⚠️ SEO検査でERRORあり: node ops/check_seo.mjs で詳細を確認"

echo "deployed: $(date -Is)"

# 週次推奨（別cronでも可）: リンク死活監視
# node ops/check_links.mjs || echo "リンク切れあり: ops/link_report.md を確認"
