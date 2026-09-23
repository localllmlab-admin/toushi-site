# ADR-0006: Bing・AI検索経由を主戦場として扱う（2026-09）

- 日付: 2026-09-23
- ステータス: 承認（Masaru指示「調査結果に基づき監査・改修・本番公開」）

## 背景

GA4（2026-08-01〜09-22）の参照元は bing 299・(direct) 96・copilot.com 45・google 36・chatgpt.com 13。
Bing系（Bing検索・Copilot）とChatGPTの合計がGoogleの約10倍だった。一方、Bing Webmaster Tools は未登録、
IndexNow は手動実行のみで、2026-08-02 以降は実行されていなかった。

公式情報（確認日: 2026-09-23）:
- ChatGPT検索は OAI-SearchBot をブロックしないことが条件で、第三者の検索プロバイダ経由でもURLを得る
  （https://developers.openai.com/api/docs/bots ／ https://help.openai.com/en/articles/12627856）
- Bing Webmaster Tools の AI Performance で Copilot 等の引用数を確認できる（ChatGPTは対象外）
- Google は AI機能向けの専用ファイル・構造化データは不要と明言（https://developers.google.com/search/docs/appearance/ai-features）

## 選択肢

1. Bing Webmaster Tools 登録＋サイトマップ送信
2. デプロイ後に IndexNow を自動送信
3. 時事コラムの鮮度更新（結果が出た事象に追記）
4. llms.txt・AI専用マークアップの追加

## 決定

1・2・3 を実施。4 は不採用（Google が不要と明言・保守対象が増える）。

## 根拠

- 1: 流入最大の検索エンジンで、索引状況と AI 引用が見えていなかった。所有確認は `msvalidate.01` メタタグ
  （DNS・Google 連携の権限付与を避けた）
- 2: `ops/deploy.sh` の最後で `node ops/indexnow.mjs --since 3`（sitemap の lastmod が直近3日のURLのみ）。
  失敗してもデプロイは止めない
- 3: AI 回答に古い記述（「会合の結果は未定」）が引用され続けるのを防ぐ

## 影響

- `msvalidate.01` メタタグを消すと Bing の所有権が外れる
- `deploy.sh` の変更は次回デプロイから有効（スクリプトが自身を pull するため）
- 観察: Bing AI Performance の引用数、GA4 の bing / copilot.com / chatgpt.com 参照元（月次）
