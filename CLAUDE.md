# CLAUDE.md — 実装・運用エージェント恒久ルール

このリポジトリは投資・トレード教育情報サイト。Claude Code / Codex はこのファイルを常に最優先で参照する。

## 出力・言語
- 日本語。結論ファースト。
- コードは自己文書化し、コンプラ制約の意図をコメントで残す。

## 絶対制約（コンプライアンス／BUILD_SPEC.md 0章と同一）
1. インサイダー情報を扱わない。規制の「解説」教育コンテンツのみ。
2. 特定銘柄の売買推奨・価格予想の断定をしない。一般化された教育のみ。
3. 「必ず儲かる」「確実」等の断定表現を実装・コンテンツともに排除。
4. 全記事末尾に `Disclaimer` を機械的に描画（frontmatter で消せない設計を維持）。
5. `sources` 空の記事はビルドを失敗させる（型で強制済み。緩めない）。
6. 匿名運用。個人名・所属をコード／コンテンツ／コミットに残さない。
7. アフィリエイトは当面入れない。将来入れる場合 `isPR` によるPR表記強制を実装。

## 実装方針
- SSG は Astro。Content Collections + Zod でスキーマ強制。
- 依存は最小限（素CSS + デザイントークン、検索は Pagefind、図は Mermaid ビルド時SVG）。
- `reviewed: false` は本番ビルドから除外すること。
- CI: `npm run validate`（ops/validate_content.mjs）を必ず通す。

## デプロイ
- ConoHa VPS + Nginx。`ops/deploy.sh` を使用。
- ビルドはべき等。VPS 再構築は `git clone && npm ci && npm run build && deploy` で復旧可能に保つ。

## 禁止表現リンター
- ops/validate_content.mjs の危険語リストを維持・拡張する。教育文脈は許可、断定推奨は不許可の判定を壊さない。

## タスク分担
- Claude Code: 環境構築・実装・CI・デプロイ・検証ロジック。
- Codex: 記事テンプレ整形・Mermaid図量産・リファクタ補助。

## v2 追加ルール
- sources は等級付き（A/B/C/D）。事実主張には A/B/C 最低1件。この基準を緩めない。
- playbook「手法」「定石」の3見出し（前提条件/検証の考え方/限界と注意）検査を壊さない。
- reviewedAt と鮮度監査（365日）を維持。`npm run validate -- --strict` で鮮度をエラー化できる。
- 週次で `node ops/check_links.mjs` を cron 登録すること（リンク切れ→ link_report.md）。
- 新記事は必ず7章体系（config.ts の chapter enum）に割り当てる。

## v4 追加ルール（品質保証・記録体制 / ADR-0001）
- 品質ゲート（計画→生成→二重レビュー→自己批判→検証）は `~/.claude/CLAUDE.md` のグローバル定義に従う。3回不合格でMasaruへエスカレーション。
- `reviewed: false → true` への昇格はMasaruの承認後のみ。hook（.claude/settings.json）が昇格操作を検出し確認を挟む。
- 重要決定は `docs/decisions/` にADR記録（テンプレ = docs/decisions/TEMPLATE.md）。
- 業務台帳 = `ops/worklog/YYYY-MM.md`。作業サマリ・決定事項・未完了タスクをセッション終了前に `node ops/logctl.mjs "内容"` で追記する（セッション終了自体はhookが自動記録）。
- セッション開始時は業務台帳の最新エントリと直近ADRを読んでから着手する。
- 月1回、auto memoryの内容サマリを業務台帳へ出力し、Masaruがレビューできる状態にする。

## v3 追加ルール（ローカルLLMハイブリッド）
- 記事生成は EVO-X1 のローカルパイプライン（ops/local/）が主。API呼び出しは記事1本につき磨き1回まで。この規律を緩めるコード変更をしない。
- jp_style_lint.mjs の検出パターンは運用で育てる（誤検出/見逃しがあればパターン追加）。既存良記事が100点を維持することを回帰テストとする。
- pipeline.mjs の品質ゲート（judge 7点以上 かつ lint 70点以上）を下げない。
- Hermes（VPS）は運用監視・PR管理・リンク死活に役割をシフト。ドラフト生成は EVO-X1 が担う。
