import { defineCollection, z } from "astro:content";

/**
 * 品質を型で強制するスキーマ。
 * - sources: 出典を「等級付きオブジェクト」に格上げ。
 *   grade A: 公的機関・規制当局・取引所（金融庁/JPX/日銀/財務省/BIS/SEC等）
 *   grade B: 学術論文・書籍（査読・出版済み）
 *   grade C: 企業公式・一次発表（IR/公式ドキュメント）
 *   grade D: 信頼できる報道
 *   grade E: 当サイト編集部調べ（リンクなし。該当する一次資料のWebページが実在しない場合のみ）
 *   → 事実主張には A/B/C（なければ E）を最低1件要求（validate_content.mjs で検査）
 *   → リンク先に実際の記事・資料がないURL（出版社トップページ等）を出典にしない（Masaru指示 2026-07-10）
 * - reviewedAt: 人間レビュー完了日。updated(内容更新日)と分離し鮮度監査に使う。
 *   1年超で「再レビュー要」を検出（永続性・正確性の担保）。
 */

const sourceSchema = z.object({
  url: z.string().url().optional(), // grade E（編集部調べ）はリンクを持たない
  title: z.string(),
  grade: z.enum(["A", "B", "C", "D", "E"]),
  // アフィリエイトリンク（広告）フラグ（ADR-0003 / monetization-plan Phase 0）。
  // true のとき Article.astro が rel="sponsored" と「広告」バッジを機械描画する。
  // ad:true を含むページは isPR:true 必須（validate_content.mjs で強制・frontmatterで外せない）。
  ad: z.boolean().default(false),
});

const commonFields = {
  title: z.string().max(120),
  description: z.string().max(200),
  tags: z.array(z.string()).default([]),
  updated: z.coerce.date(),
  reviewed: z.boolean().default(false),
  reviewedAt: z.coerce.date().optional(), // reviewed:true 時は必須（リンターで検査）
  sources: z.array(sourceSchema).min(1, "出典を最低1件（等級付き）"),
  isPR: z.boolean().default(false),
};

const learn = defineCollection({
  type: "content",
  schema: z.object({
    ...commonFields,
    level: z.number().int().min(1).max(4), // 1:入門 2:基礎 3:実践 4:上級
    order: z.number().int().default(0),
    // カリキュラム内の章（網羅性のためのマップ軸）
    chapter: z.enum([
      "お金と市場の基礎", "商品と制度", "リスク管理", "分析手法",
      "法規制とルール", "行動と心理", "テクノロジーと自動化",
    ]),
  }),
});

const playbook = defineCollection({
  type: "content",
  schema: z.object({
    ...commonFields,
    kind: z.enum(["手法", "定石", "格言", "リスク管理", "心理"]),
    // 再現性の担保：手法・定石は前提/検証/限界の3点セットを本文に必須
    // （見出し「## 前提条件」「## 検証の考え方」「## 限界と注意」をリンターで検査）
  }),
});

const charts = defineCollection({
  type: "content",
  schema: z.object({
    ...commonFields,
    patternType: z.enum(["継続", "反転", "プライスアクション", "インジケーター"]),
  }),
});

const glossary = defineCollection({
  type: "content",
  schema: z.object({
    ...commonFields,
    term: z.string(),
    reading: z.string().optional(),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { learn, playbook, charts, glossary };
