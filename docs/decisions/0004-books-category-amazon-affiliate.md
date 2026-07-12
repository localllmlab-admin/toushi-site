# ADR-0004: 「おすすめ書籍」カテゴリ新設とAmazonアソシエイト実リンク掲載開始

- 日付: 2026-07-12
- ステータス: 承認（Masaru/CEO指示 2026-07-12「アソシエイトアカウント作成済・書籍アフィリエイトを開始」）

## 背景

- ADR-0003でPhase 0（PR表記基盤）〜Phase 1（Amazonアソシエイト）の段階導入を承認済み。ただしPhase 1着手基準は「月間クリック300到達後に申請」だった。
- MasaruがAmazonアソシエイトのアカウントを自ら作成し、12冊分のアフィリエイトリンク（tag=localllmlab-22）を取得のうえ、書籍紹介カテゴリの新設と記事化を直接指示した。オーナー判断により申請時期のゲートは撤廃された（180日以内に適格販売3件の本審査要件は残るため、売れ筋書籍を含めて成約可能性を確保する）。
- 調査資料: docs/research/amazon-book-affiliate-2026-07.md（料率=紙3%/Kindle8%・報酬上限撤廃・必須文言、全てA格で確認済み）。

## 選択肢

1. 案A: 教育記事の出典欄のみアフィリ化（ADR-0003の当初案） — 実装最小だが、書籍を紹介する編集コンテンツとしての読者価値・SEO面の資産にならない。
2. 案B: 専用コレクション `books`（おすすめ書籍）を新設し、書籍紹介記事として展開 — policy.astroの「書籍紹介などの広告は出典欄・専用ページに限定」に整合。教育4コレクションの「本文への広告リンク埋め込み禁止」を維持したまま、PR専用ページとして分離できる。
3. 案C: 教育記事本文へ書籍リンクを直接埋め込み — CLAUDE.md絶対制約7に抵触。却下。

## 決定

**案Bを採用。第5コレクション `books` を新設し、12冊の書籍紹介記事で運用を開始する。**

- コンプラ実装（すべて機械描画・frontmatterで消せない）: isPR→PR表記／BookCardのCTA近傍「広告」ラベル／rel="sponsored noopener noreferrer nofollow"／アソシエイト参加表示文言／価格・在庫の時点注記。
- ADR-0003の技術的負債（Phase 1着手前の必須前提）を解消: config.ts 全コレクションに superRefine で「ad:true → isPR:true」を型レベル強制。
- validate_content.mjs にbooks固有ルール追加: isPR必須・ad:true出典必須・逆推奨（「向かない」）記述必須。
- 書影は自サイトへ複製せず、Amazon公式画像CDN（images-na / 紙版ISBN-10キー）を直接参照（著作権・規約対応。取得不可時はaltのみ表示のフォールバック）。12冊全てで取得可能を確認済み（2026-07-12）。
- アフィリURLは検索セッション由来パラメータを除去し `dp/{ASIN}?linkCode=ll2&tag=localllmlab-22&linkId={linkId}` に正規化。12組全てセッション原本と機械照合済み。
- 「報酬で評価・順序を変えない」原則は不変（policy.astroに書籍紹介の条件を追記済み）。

## 根拠

- 料率・上限撤廃・必須文言: Amazonアソシエイト公式ヘルプ（A格・docs/research/amazon-book-affiliate-2026-07.md参照）。
- ステマ規制対応の実装方針はADR-0003の機械描画原則を踏襲。
- 逆推奨必須は jp-affiliate-site スキル（信頼獲得の必須要素）に準拠。

## 影響

- コード: config.ts（books+superRefine）／BookCard.astro（新規）／pages/books/（新規2）／Base.astro（ナビ・フッター）／Article.astro（sectionLabel）／index.astro（トップ導線。注目記事一覧にはPRを混ぜない）／rss.xml.js・llms.txt.js（books追加）／generate_og.mjs（books色）／tokens.css（--color-sec-books=蘇芳#8e3b46）／validate_content.mjs（books検査）／policy.astro（広告方針の現在形化+参加文言）。
- 記事: src/content/books/ 12本（全てreviewed:false・Masaruレビュー待ち）。OGP12枚生成済み。
- 運用: reviewed昇格はMasaru承認後のみ（不変）。書影CDNが将来無効化された場合は表示が消えるだけで壊れない設計だが、check_links.mjs の対象外のため年次の目視確認を推奨。
- リスク: Amazon画像CDNの直接参照はPA-API非経由のため規約解釈に幅がある（PA-APIは適格販売3件後に利用可能になり次第移行を検討）。
