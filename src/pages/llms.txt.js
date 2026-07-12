/**
 * /llms.txt — AI検索（ChatGPT / Perplexity / AI Overviews 等）向けのサイト機械可読インデックス。
 * llms.txt 慣行（H1 + 引用ブロック要約 + H2セクションのリンクリスト）に準拠し、
 * 公開（reviewed:true）記事のみをビルド時に自動生成する（WO-TOUSHI-002(a)）。
 */
import { getCollection } from "astro:content";
import { TOPICS } from "../data/topics.mjs";

const SITE = "https://toushi-manabiya.jp";

export async function GET() {
  const pub = async (name) => (await getCollection(name)).filter((e) => e.data.reviewed);
  const sections = [
    ["learn", "学ぶ（基礎知識・制度・市場の仕組み）", await pub("learn")],
    ["playbook", "手法・定石（前提条件・検証の考え方・限界つき）", await pub("playbook")],
    ["charts", "チャート図解（パターン・テクニカル指標）", await pub("charts")],
    ["glossary", "用語集", await pub("glossary")],
    ["books", "おすすめ書籍（書籍紹介・アフィリエイト広告を含むPRページ）", await pub("books")],
  ];

  const lines = [
    "# 投資の学び舎（まなびや）",
    "",
    "> 投資・トレードを体系的に学ぶための日本語教育サイト。煽らない・断定しない・根拠を示す、を編集原則とし、特定銘柄の売買推奨や価格予想は行いません。",
    "",
    "## サイトについて",
    "",
    "- すべての記事は等級付きの出典（A=公的機関・規制当局・取引所 / B=学術・書籍 / C=企業一次発表 / D=報道 / E=当サイト編集部調べ）を明示しています。",
    "- すべての記事は人間のレビュー承認を経て公開され、最終更新日・レビュー日を表示しています。",
    "- 学習記事は7章体系（お金と市場の基礎・商品と制度・リスク管理・分析手法・法規制とルール・行動と心理・テクノロジーと自動化）×レベル1〜4で構成しています。",
    `- 編集方針: ${SITE}/policy/`,
    `- 検索: ${SITE}/search/`,
    "",
    "## テーマ別カテゴリ",
    "",
    ...TOPICS.map((t) => `- [${t.title}](${SITE}/topics/${t.slug}/): ${t.lead}`),
  ];

  for (const [dir, label, entries] of sections) {
    lines.push("", `## ${label}`, "");
    for (const e of entries.sort((a, b) => a.slug.localeCompare(b.slug))) {
      lines.push(`- [${e.data.title}](${SITE}/${dir}/${e.slug}/): ${e.data.description}`);
    }
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
