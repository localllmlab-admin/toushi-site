# Hermes Agent 運用手順書（content pipeline v3）

> **結論**：v3ではドラフト生成の主担当が EVO-X1 ローカルパイプラインに移った。Hermes（VPS）は生成担当から**運用監視・PR管理・週次リンク死活・topics_backlog.md 管理**へ役割をシフトする。作業前に必ず [BUILD_SPEC.md 0章](../../BUILD_SPEC.md#0-大原則絶対遵守コンプライアンス) を読み、すべての判断の前提とすること。

---

## 0. 前提：コンプラ0章を必ず参照する

このドキュメントに書かれた手順を実行する前に、毎回 `BUILD_SPEC.md` 冒頭の0章（インサイダー禁止／投資助言禁止／断定表現禁止／免責機械挿入／出典明示／匿名運用／ステマ規制）を確認すること。0章と本手順書が矛盾する場合は**0章が優先**。生成物・PR内容が0章に触れる疑いがある場合は、マージ提案をせず「破棄して再生成」を提案する。

`ops/hermes/SYSTEM_PROMPT.md` にも同一のコンプラ制約が埋め込まれている。ドラフト内容をレビューする際はこのシステムプロンプトのチェックリスト（自己チェック7項目）も突き合わせる。

---

## 1. v3での役割分担

| 役割 | v2以前 | v3（現在） |
|---|---|---|
| ドラフト生成 | Hermes（VPS / DeepSeek API） | **EVO-X1 ローカルパイプライン**（`ops/local/pipeline.mjs`、Qwen3 14B） |
| API使用 | 記事生成のフルパスでAPI呼び出し | 記事1本につき**磨き1回のみ**（`ops/local/ollama.mjs` 経由、`--no-polish` で0回） |
| Hermesの担当 | 生成→PR作成 | **運用監視・PR管理・週次リンク死活・topics_backlog.md管理** |

Hermes はもはや記事本文を書かない。EVO-X1 側の `ops/local/run_nightly.sh` が生成からPR作成までを完結させるため、Hermes は次の運用タスクに集中する。

### 1-1. 運用監視
- `ops/local/run_nightly.sh` の実行ログ（`ops/local/nightly.log`）を定期確認し、生成失敗・validate失敗が連続していないか把握する。
- 失敗が続く場合は原因を切り分け、必要なら `ops/hermes/topics_backlog.md` の該当トピックに注記を残す（無限リトライを避ける）。

### 1-2. PR管理
- EVO-X1 が作成した `draft/*` ブランチのPRを確認し、`validate_content.mjs` のCIステータスをチェックする。
- Hermes 自身は `reviewed:true` に変更しない（人間レビュー専権）。Hermes の役割はPRの整理・ラベリング・古いPRのクローズ提案までに限る。

### 1-3. 週次リンク死活監視
- 週次で `node ops/check_links.mjs` を実行する（cron登録済み想定）。
- リンク切れが検出されると `ops/link_report.md` が生成される。Hermes はこのレポートを確認し、修正が必要な記事・出典URLを人間に報告する（自動修正はしない＝出典の実在性は人間確認が必須）。

### 1-4. topics_backlog.md の管理
- `ops/hermes/topics_backlog.md` は7章×レベル体系のネタ帳。EVO-X1 の `pipeline.mjs` が上から未消化トピック（`- [ ]`）を1件選んで消化する。
- Hermes は消化済みトピックが正しく `- [x]` 等に更新されているか、生成失敗で取りこぼされたトピックがないかを確認する。
- 新規トピックの追加・章の偏り是正（特定の章ばかり消化されていないか）は Hermes が提案し、人間の承認を得てから追記する。

---

## 2. 全体フロー（生成 → 検証 → PR → 人間レビュー → merge → deploy）

```
[EVO-X1: 夜間バッチ（ops/local/run_nightly.sh）]
  1. topics_backlog.md から未消化トピックを1件選択
  2. ops/local/pipeline.mjs でローカル生成
     - ドラフト生成（Qwen3 14B）
     - ルーブリック審査 + 自己改稿ループ（最大2回、無料）
     - jp_style_lint.mjs（決定論・70点未満は改稿へ）
     - 合格ドラフトのみ API磨き1回（--no-polish で0回）
  3. reviewed:false で src/content/ に書き出し

  ↓ 生成失敗 or 品質未達（judge<7 または lint<70）→ このトピックはスキップし、
    次回以降に人間報告。ドラフトは公開経路に乗らない。

  4. node ops/validate_content.mjs 実行
     - 禁止表現・出典等級（A/B/C必須）・reviewedAt・再現性3見出し・frontmatter型を検証
  5. validate 失敗 → ops/local/rejected/ へ退避し、ブランチは作らず自動終了
     validate 成功 → draft/<slug>-<日付> ブランチを作成しコミット・push・PR作成（gh pr create --fill）

[Hermes（VPS）: 運用監視・PR管理]
  6. PRのCIステータス・生成ログを確認。異常があれば人間に報告

[人間: レビュー（承認のみ）]
  7. PR内容を確認。0章コンプラ・出典実在性・文体を人間が最終確認
  8. 問題なければ frontmatter を reviewed:true に変更して merge
     問題があれば修正依頼 or クローズ（reviewed:false のままなら本番ビルドから自動除外されるため、
     万一マージされても公開されない安全弁が効く）

[デプロイ]
  9. git pull && npm run build && ops/deploy.sh（post-mergeまたは手動）
  10. Nginx が dist/ を配信
```

### 安全弁まとめ
- **reviewed:false は本番ビルドから除外**（型・ビルド双方で強制）。レビュー漏れでマージされても公開されない。
- **validate 失敗時は自動クローズ**（ブランチ・PRを作らず `ops/local/rejected/` に退避）。禁止表現・出典等級・免責欠落を含む生成物がPRにすら上がらない。
- **API呼び出しは記事1本あたり磨き1回まで**。コスト超過・過剰な自動生成を構造的に防ぐ。
- **Hermes は reviewed:true を変更しない**。人間承認ゲートを迂回する経路を作らない。

---

## 3. 関連ファイル

- `BUILD_SPEC.md` 0章・§5・§9 — コンプラ大原則・自律運用フロー・v3アーキテクチャ
- `ops/hermes/SYSTEM_PROMPT.md` — ドラフト生成時のコンプラ制約・文体ガイド（EVO-X1側プロンプトのベース）
- `ops/hermes/topics_backlog.md` — ネタ帳（Hermesが管理）
- `ops/local/run_nightly.sh` — 夜間バッチ本体（生成→validate→ブランチ→PR）
- `ops/local/pipeline.mjs` — ローカル生成オーケストレーター
- `ops/check_links.mjs` — 週次リンク死活監視（`ops/link_report.md` 出力）
- `ops/validate_content.mjs` — 最終検証（禁止表現・出典等級・免責・frontmatter型）
