# ADR-0003: 収益化Phase 0-1着手（アフィリエイト導入解禁とPR表記基盤）

- 日付: 2026-07-12
- ステータス: 承認

## 背景

- 収益導線企画書 `docs/research/monetization-plan-2026-07.md`（WO-TOUSHI-001・r2 = evidence-auditor / expert-reviewer 指摘11件反映済み）をMasaru（CEO）が2026-07-12に承認（「アフィリ入れて良い・Phase 0〜1着手して良い」）。
- 従来のCLAUDE.md絶対制約7は「アフィリエイトは当面入れない」であり、導入にはこの制約の改定と意思決定の記録（ADR）が必要（企画書 §8 注記・§10-3）。
- 現状は月間GSCクリック1・収益ゼロ。収益の従属変数はSEO成長であり、本決定は「流量成長に先行して、法的に堅牢な収益基盤を低コスト・可逆に敷設する」ことが目的。

## 選択肢

1. 案A: Amazonアソシエイト（書籍出典欄のアフィリ化） — 実装コスト小・金商法上の論点ほぼなし・書籍出典のE格→B格復帰で読者価値も向上。収益は当面ほぼゼロ（仮説: 月1,000セッションで月約30円）。
2. 案B: 証券口座ASP（アクセストレード中心） — 流量成長後の主力候補（仮説: 月1万セッションで月約17,500円）。ただし広告主審査と匿名運用（絶対制約6）が構造的に矛盾し、未決のまま進められない。
3. 案C: AdSense等運用型広告 — 投資勧誘系広告の混入を自サイトで統制できず、YMYL領域のE-E-A-T・ブランド（中立・信頼性最優先）と正面衝突。単価根拠も弱い。
4. 案D: 有料note・講座等の直接課金 — 会員限定・継続課金等の販売形態次第で無登録の投資助言・代理業（金商法29条・刑事罰対象）に最接近する境界領域。

## 決定

**A→Bの段階導入を承認し、Phase 0（基盤整備）〜Phase 1（Amazonアソシエイト）に着手する。CはPhase 3での再評価のみ（原則見送り）、Dは原則実施しない。Phase 2（証券ASP）は「匿名運用の扱い（実名等開示 or 証券アフィリ断念）」を別ADRで決裁してからのみ着手する。**

- Phase 0（本コミットで実装）: `isPR: true` によるPR表記の機械挿入／`sources[].ad: true` → `rel="sponsored"` ＋リンク近傍「広告」バッジの機械描画／validate による「ad:true なら isPR:true 必須」の強制／policy.astro への広告掲載方針の明文化。**収益リンクはまだ貼らない。**
- Phase 1着手基準: 月間クリック300（GSC・28日間）到達後にAmazonアソシエイト申請（申請後180日以内に適格販売3件必須のため、それ以前の申請は行わない）。
- CLAUDE.md絶対制約7を「monetization-plan準拠で導入可」へ改定（isPR・sponsored・広告バッジ・reviewed昇格ルール不変を明記）。

## 根拠

- ステマ規制（景表法5条3号指定告示・2023-10-01施行）: アフィリ広告も適用対象であり、PR表記＋リンク近傍の広告明示が必要。出典: [消費者庁 ステルスマーケティング告示](https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing)（A格）。
- 金商法: 無料公開・会員制なしの一般的情報提供は投資助言業登録不要。会員限定販売は登録要となり得る（案D原則禁止の根拠）。出典: [関東財務局 登録に係るQ&A](https://lfb.mof.go.jp/kantou/rizai/pagekthp0320003150.html)（A格）。
- 広告リンクへの `rel="sponsored"`: Googleの推奨。出典: [Google Search Central: Qualify your outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)（C格）。
- Amazonアソシエイトの180日以内適格販売3件要件: [アソシエイト・セントラル ヘルプ](https://affiliate.amazon.co.jp/help/node/topic/G7MJTPEP9NC3YKMG)（C格）→ Phase 1着手基準（月間クリック300・仮説値）の根拠。
- 収益見込み・フェーズゲート・撤回基準の詳細は monetization-plan §6・§8（数値は仮説であり、ゲート実測で置換する）。

## 影響

- CLAUDE.md絶対制約7の文言変更（本ADRで承認）。v5ルールの「書籍出典はAmazonアフィリ導入時にisPRとセットで解禁」が実行可能になる。
- コード: `src/content/config.ts`（sources[].ad）・`src/layouts/Article.astro`（PR表記・広告バッジ・sponsored）・`ops/validate_content.mjs`（ad→isPR強制）・`src/pages/policy.astro`（広告掲載方針）。
- 運用: Phase 1申請は月間クリック300到達後（それまで収益リンクは貼らない）。Phase 2着手前に匿名運用の扱いを別ADRで決裁（未決のままの提携申請は禁止）。撤回基準（SEO悪化30%×2ヶ月でリンク撤去等）は monetization-plan §8 に従う。
- リスク: E-E-A-T低下・ステマ規制違反・案件審査非承認等は monetization-plan §9 のリスク一覧と緩和策を正とする。
