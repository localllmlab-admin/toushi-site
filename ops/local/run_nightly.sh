#!/usr/bin/env bash
# EVO-X1 夜間バッチ：ローカル生成 → 検証 → ブランチ → PR
# cron 例（WSL2）: 0 2 * * * cd /path/to/toushi-site && ops/local/run_nightly.sh >> ops/local/nightly.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/../.."

git checkout main && git pull --ff-only

# APIキーは ops/local/.env（gitignore済）から読む。未設定なら磨きなしで運転（完全ゼロコスト）
[ -f ops/local/.env ] && { set -a; . ops/local/.env; set +a; }
POLISH_FLAG=""
[ -z "${OPENROUTER_API_KEY:-}" ] && POLISH_FLAG="--no-polish"

# 1. ローカル生成（API磨きを止めたい日は --no-polish を付ける）
OUT=$(node ops/local/pipeline.mjs $POLISH_FLAG) || { echo "生成失敗/品質未達: $(date -Is)"; exit 0; }

# 2. 全体検証（コンプラ・出典等級・再現性・鮮度）
node ops/validate_content.mjs || { echo "validate失敗。生成物を退避"; mkdir -p ops/local/rejected; mv "$OUT" ops/local/rejected/; git checkout .; exit 0; }

# 3. ブランチ + PR（reviewed:false のまま。人間が承認して reviewed:true で merge）
SLUG=$(basename "$OUT" .md)
BRANCH="draft/${SLUG}-$(date +%Y%m%d)"
git checkout -b "$BRANCH"
git add "$OUT"
git commit -m "draft: ${SLUG}（ローカル生成・要レビュー）"
git push -u origin "$BRANCH"
command -v gh >/dev/null && gh pr create --fill --label draft || echo "gh 未導入: 手動でPR作成"
git checkout main

# バックログの消化済みマークは main に直接記録（重複生成の防止。記事本体はPRレビュー経由のまま）
git add ops/hermes/topics_backlog.md
git diff --cached --quiet || { git commit -m "backlog: 消化済みマーク（自動）"; git push; }

echo "PR作成完了: $BRANCH $(date -Is)"
