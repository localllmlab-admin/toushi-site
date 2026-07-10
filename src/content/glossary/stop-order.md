---
title: "逆指値注文"
description: "指定した価格より不利な方向に動いたときに執行される注文。損切りの自動化に使う。"
term: "逆指値注文"
reading: "ぎゃくさしね"
tags: ["用語"]
updated: 2026-07-07
reviewed: true
reviewedAt: 2026-07-07
sources:
  - url: "https://www.jpx.co.jp/glossary/"
    title: "日本取引所グループ（用語集）"
    grade: "A"
related: ["指値注文・成行注文", "スリッページ"]
---

「ここまで**下がったら**売る」「ここまで**上がったら**買う」という、不利な方向への動きを条件に執行される注文です。最大の用途は**損切りの自動化**で、感情が判断を歪める前に撤退を機械に任せられます（損切りできない心理の記事を参照）。ブレイクアウトへの追随（高値超えで買い）にも使われます。執行時は成行になるものが多く、急変時はスリッページを伴う点に注意が必要です。

<figure class="diagram">
  <img src="/diagrams/stop-order.svg" alt="現在値より下に置く売り逆指値と上に置く買い逆指値を示した図" width="640" height="265" loading="lazy" />
  <figcaption>図：逆指値の2つの使い方。損切りの自動化とブレイク追随（模式図であり、実在の銘柄・価格ではありません）</figcaption>
</figure>
