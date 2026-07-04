#!/usr/bin/env bash
# ConoHa VPS デプロイ。post-merge や cron / Claude Code から実行。
set -euo pipefail
REPO_DIR="${REPO_DIR:-/var/www/toushi-site}"

cd "$REPO_DIR"
git pull --ff-only
npm ci
npm run validate          # コンプラ・品質・鮮度リンター（失敗したら公開しない）
npm run build             # astro build + pagefind
echo "deployed: $(date -Is)"

# 週次推奨（別cronでも可）: リンク死活監視
# node ops/check_links.mjs || echo "リンク切れあり: ops/link_report.md を確認"
