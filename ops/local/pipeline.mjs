#!/usr/bin/env node
/**
 * ローカルLLM記事生成パイプライン（EVO-X1 で実行）。
 *
 * フロー：
 *   1. topics_backlog.md から未消化トピック（[ ]）を1件選択
 *   2. Ollama でドラフト生成（テンプレ厳守）
 *   3. Ollama 審査員がルーブリック採点 → 不合格なら改稿指示付きで自己改稿（最大N回）
 *   4. jp_style_lint.mjs（決定論）で日本語品質検査 → 不合格なら改稿ループへ戻す
 *   5. 合格ドラフトのみ API（DeepSeek）で磨き1回 ← 記事あたりのAPI呼び出しはこの1回だけ
 *   6. validate_content.mjs で最終検査 → src/content/ に書き出し
 *   （git ブランチ作成・PR は run_nightly.sh が担当）
 *
 * 使い方: node ops/local/pipeline.mjs [--dry-run] [--no-polish] [--topic "..."]
 *   --dry-run  : ファイルを書かず標準出力へ
 *   --no-polish: API磨きをスキップ（完全ゼロコスト運転）
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ollamaChat, polishViaApi } from "./ollama.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const cfg = JSON.parse(readFileSync(join(HERE, "config.json"), "utf8"));
const DRY = process.argv.includes("--dry-run");
const NO_POLISH = process.argv.includes("--no-polish");
const topicArg = (() => { const i = process.argv.indexOf("--topic"); return i > -1 ? process.argv[i + 1] : null; })();

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const today = new Date().toISOString().slice(0, 10);

// ---------- 1. トピック選択 ----------
function pickTopic() {
  if (topicArg) return { line: topicArg, collection: guessCollection(topicArg) };
  const backlog = read("ops/hermes/topics_backlog.md");
  let section = "";
  for (const line of backlog.split("\n")) {
    const h = line.match(/^## (\w+)/);
    if (h) section = h[1];
    const m = line.match(/^- \[ \] (.+)$/);
    if (m) return { line: m[1], collection: section || "learn" };
  }
  throw new Error("未消化トピックがありません（topics_backlog.md）");
}
function guessCollection(t) {
  if (/パターン|チャート|ライン|クロス|RSI/.test(t)) return "charts";
  if (/手法|定石|格言|心理|リスク管理/.test(t)) return "playbook";
  return "learn";
}

// ---------- 2〜3. 生成 + 審査ループ ----------
function extraFrontmatter(collection, topic) {
  if (collection === "learn") {
    const lv = (topic.match(/level (\d)/) || [, "2"])[1];
    return `level: ${lv}\norder: 50\nchapter: "お金と市場の基礎"  # レビュー時に7章から正しい章へ修正`;
  }
  if (collection === "playbook") return `kind: "定石"  # レビュー時に確認`;
  if (collection === "charts") return `patternType: "反転"  # レビュー時に確認`;
  return "";
}
function reproSections(collection, topic) {
  const isMethod = collection === "playbook" && /手法|定石/.test(topic);
  return isMethod
    ? "## 前提条件\n\n（この話が成り立つ条件）\n\n## 検証の考え方\n\n（読者が自分で確かめる方法）\n\n## 限界と注意\n\n（成り立たないケース・免責）"
    : "";
}

async function generate(topic, collection) {
  const tpl = read("ops/local/prompts/DRAFT_PROMPT.md")
    .replaceAll("{{TODAY}}", today)
    .replaceAll("{{EXTRA_FRONTMATTER}}", extraFrontmatter(collection, topic))
    .replaceAll("{{REPRO_SECTIONS}}", reproSections(collection, topic));

  let draft = await ollamaChat(cfg, [
    { role: "system", content: tpl },
    { role: "user", content: `トピック: ${topic}\nコレクション: ${collection}\n記事を書いてください。` },
  ]);
  draft = stripFences(draft);

  const rubric = read("ops/local/prompts/JUDGE_RUBRIC.md");
  for (let i = 0; i <= cfg.quality.maxSelfRefineLoops; i++) {
    const verdictRaw = await ollamaChat(cfg, [
      { role: "system", content: rubric },
      { role: "user", content: draft },
    ], { model: cfg.ollama.judgeModel, options: { temperature: 0.1 } });
    const verdict = safeJson(verdictRaw) ?? { score: 0, compliance_violation: false, fix_instructions: "JSON解析失敗。テンプレに厳密に従い再生成" };
    console.error(`  審査 ${i + 1}回目: score=${verdict.score} 違反=${verdict.compliance_violation}`);

    const lint = styleLint(draft);
    console.error(`  スタイルlint: ${lint.score}/100（指摘${lint.issues.length}件）`);

    const ok = !verdict.compliance_violation
      && verdict.score >= cfg.quality.judgePassScore
      && lint.score >= cfg.quality.styleLintPassScore;
    if (ok) return draft;
    if (i === cfg.quality.maxSelfRefineLoops) {
      throw new Error(`品質基準未達（score=${verdict.score}, lint=${lint.score}）。このトピックはスキップし人間に報告`);
    }
    // 自己改稿：審査指摘 + lint指摘を渡して書き直させる
    const fixes = [
      verdict.fix_instructions,
      ...lint.issues.map((x) => `[${x.type}] ${x.detail}`),
    ].filter(Boolean).join("\n");
    draft = stripFences(await ollamaChat(cfg, [
      { role: "system", content: tpl },
      { role: "user", content: `以下のドラフトを、指摘事項をすべて解消して全文書き直してください。\n\n# 指摘事項\n${fixes}\n\n# ドラフト\n${draft}` },
    ]));
  }
}

// ---------- 4. スタイルlint（jp_style_lint.mjs をプロセス呼び出し） ----------
function styleLint(draft) {
  const tmp = join(ROOT, "ops", "local", ".tmp_draft.md");
  writeFileSync(tmp, draft);
  try {
    const out = execFileSync("node", [join(ROOT, "ops/jp_style_lint.mjs"), tmp, "--json"], { encoding: "utf8" });
    return JSON.parse(out);
  } catch (e) {
    // exit 1（要改稿）でも stdout に JSON が出る
    try { return JSON.parse(e.stdout); } catch { return { score: 0, issues: [{ type: "lint", detail: "lint実行失敗" }] }; }
  }
}

// ---------- 5. API磨き（1回だけ） ----------
async function polish(draft) {
  if (NO_POLISH || !cfg.polish.enabled) { console.error("  API磨き: スキップ"); return draft; }
  console.error("  API磨き: 1回実行");
  const polished = stripFences(await polishViaApi(cfg, read("ops/local/prompts/POLISH_PROMPT.md"), draft));
  // 磨き後に禁止表現が混入していないか即検査（混入なら磨き前を採用＝安全側）
  const lint = styleLint(polished);
  return lint.score >= styleLint(draft).score ? polished : draft;
}

// ---------- util ----------
function stripFences(s) {
  return s.replace(/^```(?:markdown|md)?\n?/m, "").replace(/\n?```\s*$/m, "").trim() + "\n";
}
function safeJson(s) {
  const m = s.match(/\{[\s\S]*\}/);
  try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
}
function slugify(t) {
  return t.toLowerCase().replace(/（.*?）/g, "").replace(/[^a-z0-9ぁ-んァ-ヶ一-龠ー]/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `draft-${Date.now()}`;
}

// ---------- main ----------
const { line: topic, collection } = pickTopic();
console.error(`▶ トピック: ${topic}（${collection}）`);
let article = await generate(topic, collection);
article = await polish(article);

if (DRY) { console.log(article); process.exit(0); }

const outPath = join(ROOT, "src", "content", collection, `${slugify(topic)}.md`);
if (existsSync(outPath)) throw new Error(`既存ファイルと衝突: ${outPath}`);
writeFileSync(outPath, article);

// バックログを消化済みにする（生成成功時のみ・--topic直指定時は対象なし）
if (!topicArg) {
  const blPath = join(ROOT, "ops/hermes/topics_backlog.md");
  const bl = readFileSync(blPath, "utf8");
  const marked = bl.replace(`- [ ] ${topic}`, `- [x] ${topic} → done ${today}`);
  if (marked !== bl) { writeFileSync(blPath, marked); console.error("  バックログ: done 記録"); }
}

console.error(`✅ 出力: ${outPath}（reviewed:false。validate → PR は run_nightly.sh が実行）`);
console.log(outPath);
