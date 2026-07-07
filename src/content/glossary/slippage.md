---
title: "スリッページ"
description: "注文時に想定した価格と実際の約定価格のズレ。"
term: "スリッページ"
reading: "すりっぺーじ"
tags: ["用語"]
updated: 2026-07-07
reviewed: true
reviewedAt: 2026-07-07
sources:
  - url: "https://www.ffaj.or.jp/"
    title: "金融先物取引業協会（FXの基礎知識）"
    grade: "A"
related: ["約定", "スプレッド", "ロスカット"]
---

注文したときに見えていた価格と、実際に約定した価格のズレです。価格が急変しているときや流動性が薄いときに大きくなります。特に**成行注文と逆指値（損切り）の執行時**に発生しやすく、「損切りラインぴったりで切れる保証はない」というリスク管理上の重要な前提になります。バックテストにスリッページを織り込まないと、成績は実際より良く見えます。

<figure class="diagram">
  <img src="/diagrams/slippage.svg" alt="注文した価格と実際の約定価格がずれるスリッページを示した図" width="640" height="240" loading="lazy" />
  <figcaption>図：スリッページの構造。急変時・薄い流動性で大きくなる（模式図であり、実在の銘柄・価格ではありません）</figcaption>
</figure>
