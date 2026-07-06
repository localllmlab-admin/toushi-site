# ADR-0001: 品質保証・記憶管理体制のセットアップ

- 日付: 2026-07-07
- ステータス: 承認（Masaru承認済み・指示書 = ~/Downloads/claude-code-quality-setup-instruction.md）

## 背景

上位モデル（Fable 5）が利用できなくなった後も、同水準の正確性・信頼性・再現性を Claude Code 単体で出せるよう、品質を「モデル性能」ではなく「プロセス」で担保する体制を構築した。hooks は決定論的（100%）、CLAUDE.md は確率的、という使い分けが背骨。

## 選択肢

1. CLAUDE.md への記載のみ — 実装コスト最小だが遵守は確率的
2. hooks による決定論的強制 + CLAUDE.md の併用 — 絶対条件はhooksへ、判断を要するものはCLAUDE.mdへ（採用）
3. 全ルールをhooks化 — 知的判断（レビュー品質等）はシェルコマンドで強制できず不可能

## 決定

案2を採用。以下を実装した。

- グローバル（~/.claude）
  - settings.json: PreToolUse(Bash) hook `hooks/block_dangerous.mjs`（rm再帰強制削除・force push・del /s・format/mkfs・shutdown をexit 2で遮断）、`autoMemoryEnabled: true` 明示
  - CLAUDE.md: 大原則・品質ゲート5段階（計画→生成→二重レビュー→自己批判→検証、3回不合格でエスカレーション）・記録ルールを追記
  - agents: design-implementer/ui-reviewer に model: sonnet 明示。ui-reviewer/evidence-auditor/market-researcher に memory: user（個別永続メモリ）
- toushi-site
  - .claude/settings.json: PreToolUse=reviewed:true昇格をask化（ops/hooks/reviewed_gate.mjs）、PostToolUse=src/content編集後にjp_style_lint自動実行・70点未満はexit 2で差し戻し（ops/hooks/post_edit_lint.mjs）、SessionEnd=業務台帳へgitメタ情報自動追記
  - 業務台帳: ops/worklog/YYYY-MM.md + 追記CLI ops/logctl.mjs（新規作成）
  - CLAUDE.md v4ルール: 台帳・ADR参照・月次メモリレビューを追記

## 根拠

- hooks仕様・agents frontmatter（memory: user）・autoMemoryEnabled は公式ドキュメントで確認（https://code.claude.com/docs/en/hooks-guide.md / sub-agents.md / memory.md、確認日: 2026-07-07）
- 検証実績: rm -fr（permissions.denyのプレフィックス一致をすり抜けるフラグ順）がhookで実ブロックされることを実演済み。reviewed_gate/post_edit_lint/logctl はstdin JSONのpipe-testで動作確認済み

## 影響（指示書からの意図的な逸脱を含む）

- **本番ブランチへの直接push遮断は実装しない**: ai-no-iroha等で main への push＝本番デプロイが正規フローのため、遮断すると既存運用が壊れる。force push のみ遮断
- **指示書が前提とした「既存の業務台帳・logctl・5サブエージェント体制」は実在しなかった**: 台帳とlogctlは本ADRで新規作成。サブエージェントは既存8体＋内蔵Plan/code-reviewを流用し、planner/reviewerの新設はしない（Simplicity First）
- **SessionEndフックが決定論的に書けるのはgitメタ情報まで**: 知的な作業サマリはCLAUDE.mdルール（logctl手動追記）による確率的運用。hookはその取りこぼし検知の下支え
- hook実行はNode.js依存（既存のops/スクリプト群と同一の前提）
