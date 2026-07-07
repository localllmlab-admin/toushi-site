---
title: "アービトラージ（裁定取引）"
description: "同じ価値のものの価格差を、安い方を買い高い方を売って確定させる取引。さや取りとも。"
term: "アービトラージ"
reading: "あーびとらーじ"
tags: ["用語"]
updated: 2026-07-07
reviewed: true
reviewedAt: 2026-07-07
sources:
  - url: "https://www.jpx.co.jp/"
    title: "日本取引所グループ（先物・オプションの基礎）"
    grade: "A"
related: ["ヘッジ", "流動性", "約定"]
---

本来同じ価値を持つはずの資産が市場や形態によって異なる価格になっているとき、**安い方を買い、高い方を売って差額を確定させる取引**です。日本語では裁定取引。現物と先物の価格差を突く指数裁定などが代表例です。理論上は相場の方向に依存しない利益ですが、実際には価格差は高速のアルゴリズムが奪い合って一瞬で消えるため、**執行の遅れ・コスト・取引相手のリスクを引いた残りだけが利益**になります。似た資産の割高・割安の「差」を取る手法は[さや取り（ペアトレード）](/playbook/pair-trading-sayatori/)、仕組みの全体は[アービトラージとは何か](/playbook/arbitrage-basics/)を参照してください。

<figure class="diagram">
  <img src="/diagrams/arbitrage.svg" alt="同一資産が2つの市場で異なる価格のとき、安い方を買い高い方を売る裁定取引の模式図" width="640" height="225" loading="lazy" />
  <figcaption>図：アービトラージの基本構造（模式図であり、実在の価格ではありません）</figcaption>
</figure>
