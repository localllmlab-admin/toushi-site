# 投資・トレード教育情報サイト 構築・運用スペック

> このドキュメントは Claude Code / Codex に渡す実装指示書兼、Hermes agent（DeepSeek）による自律運用の運用仕様書です。
> **結論ファースト**：Astro 静的サイト、ConoHa VPS + Nginx 配信、Markdown コンテンツを Git で管理、Hermes がドラフト生成、Claude Code / Codex がビルド・デプロイ。

---

## 0. 大原則（絶対遵守・コンプライアンス）

このサイトは証券外務員（証券会社勤務）である運営者の資産です。以下は**技術要件と同格の必須制約**であり、Hermes agent の自律運用時も含めて例外なく適用する。

1. **インサイダー情報は一切扱わない。** 未公表の重要事実を示唆・伝達・利用する内容は生成・掲載しない（金商法166条・167条）。本サイトでは「インサイダー取引規制そのものを解説する教育コンテンツ」としてのみ扱う。
2. **投資助言・推奨をしない。** 特定銘柄の売買推奨、「買い時」「売り時」の断定、価格予想の断定を禁止（金商法・投資助言業）。一般化された教育・解説・歴史的事実のみ。
3. **断定的判断の提供禁止。** 「必ず儲かる」「確実」等の表現を禁止。
4. **すべての教育記事末尾に免責を自動挿入**（後述の `Disclaimer` コンポーネントで機械的に強制）。
5. **出典明示。** 事実・データには一次情報（取引所・規制当局・原論文）へのリンクを付す。SEO集約サイトの引き写しをしない。
6. **匿名運用の維持。** 個人名・所属を一切露出しない。屋号・ペンネームのみ。
7. **ステマ規制・特商法。** 当面非収益化のためアフィリンクは置かない。将来入れる場合はPR表記を機械的に強制する設計余地を残す（`isPR` frontmatter）。

> Hermes のシステムプロンプトにこの0章を必ず埋め込む（`ops/hermes/SYSTEM_PROMPT.md` 参照）。生成物が上記に触れる場合は「破棄して再生成」をデフォルト挙動とする。

---

## 1. コンセプト

投資家・トレーダー向けの、高品質・信頼・安心・安全を最優先した情報／学習サイト。
当面は収益化を目指さず、コンテンツ品質・情報量・有用性・ファン獲得を優先。
「子供に見せても自信を持って自慢できる」水準の、誠実で教育的なサイトを恒久運用する。

### 3本柱（ユーザー選択に基づく主軸）
- **A. 学習・教育コンテンツ**（体系的カリキュラム型）
- **B. 取引手法・定石・格言のリファレンス**
- **C. チャート分析・パターン図解**（ビジュアル型）

（マーケットのデイリー速報は当面持たない＝運用負荷と誤情報リスクを避ける。「読み方の教育」に振る）

---

## 2. 技術スタック

| 領域 | 採用 | 理由 |
|---|---|---|
| SSG | **Astro** | Markdown/MDX ネイティブ、Content Collections で型安全、Claude Code パイプラインと親和 |
| コンテンツ | **Markdown + MDX** | Git 管理、差分レビュー容易、Hermes 生成に最適 |
| スキーマ検証 | **Astro Content Collections + Zod** | frontmatter を型で強制、免責・カテゴリ漏れを防止 |
| 図解 | **Mermaid**（ビルド時SVG化）+ 自作SVG | チャートパターンの図解、依存を軽く |
| 検索 | **Pagefind** | 完全静的・サーバー不要の全文検索 |
| スタイル | 素のCSS（デザイントークン） | 依存最小・長期保守性 |
| ホスティング | **ConoHa VPS + Nginx** | 既存資産活用 |
| デプロイ | Git push → VPS で `git pull && build` → Nginx 配信 | シンプル・再現可能 |
| 自律運用 | **Hermes agent (DeepSeek)** ドラフト生成 → PR | 夜間バッチ、人手はレビュー承認のみ |

---

## 3. ディレクトリ構成

```
toushi-site/
├─ src/
│  ├─ content/
│  │  ├─ config.ts            # Content Collections スキーマ（Zod）
│  │  ├─ learn/               # A. カリキュラム（level: 1..4）
│  │  ├─ playbook/            # B. 手法・定石・格言
│  │  ├─ charts/             # C. チャートパターン図解
│  │  └─ glossary/           # 用語集
│  ├─ components/
│  │  ├─ Disclaimer.astro     # 免責（記事末に機械挿入）
│  │  ├─ Callout.astro
│  │  ├─ Mermaid.astro
│  │  └─ Toc.astro
│  ├─ layouts/
│  │  ├─ Base.astro
│  │  └─ Article.astro        # 免責を強制的に描画
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ learn/[...slug].astro
│  │  ├─ playbook/[...slug].astro
│  │  ├─ charts/[...slug].astro
│  │  └─ glossary/index.astro
│  └─ styles/tokens.css
├─ ops/
│  ├─ hermes/
│  │  ├─ SYSTEM_PROMPT.md     # 0章コンプラを内包
│  │  ├─ content_pipeline.md  # 生成→検証→PRの手順
│  │  └─ topics_backlog.md    # ネタ帳（Hermesが消化）
│  ├─ validate_content.mjs    # frontmatter・禁止表現・免責チェック
│  └─ deploy.sh               # VPSデプロイ
├─ CLAUDE.md                  # Claude Code / Codex 用の恒久ルール
├─ astro.config.mjs
├─ nginx.conf.sample
└─ package.json
```

---

## 4. コンテンツスキーマ（型で品質を強制）

`src/content/config.ts` にて全記事共通で以下を必須化：
- `title`, `description`, `category`, `tags`, `level`(learnのみ), `updated`(日付)
- `reviewed`: boolean（人間レビュー承認済みか。falseは本番ビルドから除外）
- `sources`: URL配列（一次情報。空配列不可＝ファクト無出典を防ぐ）
- `isPR`: boolean（既定false。将来のPR表記用）

`reviewed: false` の記事は本番ビルドで除外 → **未レビュー自動生成物が公開されない**安全弁。

---

## 5. 自律運用フロー（Hermes + Claude Code / Codex）

```
[夜間バッチ on VPS]
  1. Hermes: topics_backlog.md から未消化トピックを1件選ぶ
  2. Hermes: 0章コンプラ制約下でMarkdownドラフト生成（sources必須）
  3. Hermes: reviewed:false でブランチにコミット、PR作成
  4. validate_content.mjs 実行（禁止表現・免責・出典・frontmatter検証）
      → 落ちたら自動クローズ＆再生成キューへ
[運営者：夜間レビュー（承認のみ）]
  5. 人間が内容確認 → reviewed:true に変更してmerge
[デプロイ]
  6. Claude Code / Codex（またはpost-merge hook）: git pull && npm run build && deploy.sh
  7. Nginx が /var/www/toushi-site/dist を配信
```

Claude Code と Codex の役割分担：
- **Claude Code**：環境構築、Astro実装、コンポーネント、CI、デプロイスクリプト、検証ロジック
- **Codex**：反復的な記事テンプレ整形、Mermaid図の量産、リファクタ補助

---

## 6. 品質・信頼のための機構

- **免責の機械挿入**：`Article.astro` が全記事末に `Disclaimer` を必ず描画（frontmatterで消せない）。
- **禁止表現リンター**：`validate_content.mjs` が「必ず儲かる」「確実」「絶対」「インサイダー」等の危険語を検出し、文脈判定（教育解説文脈は許可、断定推奨は不許可）。
- **出典必須**：`sources` 空でビルド失敗。
- **更新日表示**：情報の鮮度を明示。
- **アクセシビリティ & Lighthouse**：CIで閾値チェック。

---

## 7. 恒久運用の安定性

- 静的配信のため障害面が小さい（DBなし・動的サーバーなし）。
- ビルドはべき等・再現可能。VPS再構築時も `git clone && npm ci && build` で復旧。
- コンテンツは Git が単一の真実。バックアップは Git リモート複製で足りる。

---

以降のファイル（config.ts, CLAUDE.md, SYSTEM_PROMPT.md, validate_content.mjs, deploy.sh, サンプル記事）を同梱。Claude Code / Codex はこの構成に沿って残りを実装すること。

---

## 8. v2 監査・最適化（実装済み）

ゴール「日本で一番役に立つ投資教育サイト」に照らした監査に基づき、以下を実装した。すべて実ビルド・ネガティブテストで動作検証済み。

### 信頼性・根拠（出典等級制）
- `sources` を等級付きオブジェクトに格上げ：A=公的機関/規制当局/取引所、B=学術、C=一次発表、D=報道。
- **事実主張には A/B/C を最低1件必須**（D のみは不可＝報道引き写し防止）。リンターで機械検査。
- 記事末に等級バッジ付きで出典を可視化。`/policy/`（編集方針ページ）で等級制を公開説明（E-E-A-T）。

### 再現性
- playbook の「手法」「定石」記事は `## 前提条件` `## 検証の考え方` `## 限界と注意` の3見出し必須。リンターで検査。
- Hermes プロンプトに再現性テンプレートを内蔵。

### 正確性・永続性（鮮度管理）
- `reviewedAt`（人間レビュー日）を `updated` と分離。reviewed:true なのに reviewedAt 欠落はエラー。
- **レビューから365日超で再レビュー警告**（`--strict` でエラー化）。記事にレビュー日を表示。
- `ops/check_links.mjs`：出典リンクの死活監視（週次cron推奨）。切れたら `ops/link_report.md` に出力。

### 網羅性
- learn を **7章体系**（基礎/商品と制度/リスク管理/分析手法/法規制/心理/テクノロジー）× 4レベルに再編。`chapter` を型で強制。
- `/learn/` に**学習マップ**（章×レベルの全体地図）を実装。
- topics_backlog.md を約60トピックの体系ツリーに拡張（FX/ETF/レバETF/暗号資産/ミームコイン/クオンツ/HFT/bot/バックテスト/地政学/金利/心理まで網羅）。

### 親近感
- Hermes プロンプトに**文体ガイド**を内蔵：結論ファースト、読者と同じ目線、日常の比喩、煽らない、1文60字以内、「わからないことは正直に」。

### 発見性・継続接点
- JSON-LD（Article 構造化データ）、OGP メタタグ、RSS フィード（/rss.xml）、編集方針ページ、各セクションの一覧ページ。

### 検証済みの安全網（多層防御）
1. 型（Zod）: sources 等級・chapter・level の強制
2. リンター: 禁止表現/インサイダー示唆/出典等級/再現性3見出し/reviewedAt/鮮度
3. ビルド除外: reviewed:false は本番に出ない
4. デプロイ: validate 失敗時は公開されない（deploy.sh）
5. 生成時: Hermes 自己チェックリスト

---

## 9. v3: ローカルLLMハイブリッド生成（EVO-X1 / APIコスト削減）

### アーキテクチャ
```
[GMKtec EVO-X1 (WSL2 + Ollama / Qwen3 14B)]     コスト
  1. ドラフト生成（厳格テンプレ＋文体アンカー）    ¥0
  2. ローカル審査員：ルーブリック10点採点          ¥0
  3. 不合格→改稿指示付き自己改稿（最大2回）        ¥0
  4. jp_style_lint.mjs：翻訳調・文体混在・長文・   ¥0
     語尾単調・冗長を決定論検出（70点未満は改稿へ）
  5. 合格ドラフトのみ API磨き1回（DeepSeek）       数円以下/記事（--no-polish で¥0）
  6. validate_content.mjs → ブランチ → PR
[VPS/人間] レビュー承認（reviewed:true）→ merge → deploy
```
**試行錯誤（トークン消費の大半）が全てローカル**に寄り、API使用は記事1本あたり最大1呼び出しに固定される。

### ローカルでも日本語品質が落ちない5つの機構
1. **自由度制約**: 厳格テンプレ＋模範記事の文体アンカーで「穴埋め」に近い生成にする
2. **ローカル審査ループ**: ルーブリック採点→改稿指示→書き直し。無料なので何度でも回せる
3. **決定論リンター**: LLMの自己申告に頼らず機械検出（ことができます/と言えるでしょう/いかがでしたか/文体混在/110字超/語尾3連続/冗長表現）。悪文テストでスコア60→改稿行きを確認済み
4. **API磨きは表現のみ**: 内容・出典・構成の変更禁止。磨き後にlintスコアが下がれば磨き前を採用（安全側フォールバック）
5. **人間承認ゲート**: reviewed:true は人間のみ。品質未達はops/local/rejected/へ退避され公開経路に乗らない

### ファイル
- `ops/local/pipeline.mjs` … オーケストレーター（--dry-run / --no-polish / --topic 対応）
- `ops/local/ollama.mjs` … Ollama/OpenRouter 最小クライアント（依存ゼロ）
- `ops/local/config.json` … モデル・閾値・API設定（qwen3:14b 既定。差し替えは設定のみ）
- `ops/local/prompts/` … DRAFT_PROMPT / JUDGE_RUBRIC / POLISH_PROMPT
- `ops/local/run_nightly.sh` … 夜間cron：生成→validate→ブランチ→PR
- `ops/jp_style_lint.mjs` … 日本語スタイルリンター（npm run lint:jp）
- `ops/local/README.md` … EVO-X1 セットアップ手順

### npm scripts
- `npm run draft:dry` … ファイルを書かずローカル生成をテスト（API不使用）
- `npm run draft:local` … 本番生成1本
- `npm run lint:jp <file>` … スタイル検査単体実行
