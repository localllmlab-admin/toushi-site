#!/usr/bin/env node
/**
 * 日本語スタイルリンター（決定論的・APIコストゼロ）。
 * ローカルLLM出力に典型的な弱点を機械検出する：
 *  1. 翻訳調・AI調の定型表現（頻度で判定）
 *  2. 文体混在（ですます／である）
 *  3. 長すぎる文（>110字）
 *  4. 同一語尾の3連続（単調さ）
 *  5. 冗長表現・二重敬語
 * 使い方: node ops/jp_style_lint.mjs <file.md> [--json]
 *   --json: パイプライン用にJSONで結果を返す（score 0-100）
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
const asJson = process.argv.includes("--json");
if (!file) { console.error("usage: jp_style_lint.mjs <file.md>"); process.exit(2); }

const raw = readFileSync(file, "utf8");
const body = raw.replace(/^---\n[\s\S]*?\n---/, "")
  .replace(/```[\s\S]*?```/g, "")   // コードブロック除外
  .replace(/^#.*$/gm, "")            // 見出し除外
  .replace(/\|.*\|/g, "");           // 表除外

const issues = [];
const warn = (type, detail) => issues.push({ type, detail });

// --- 1. 翻訳調・AI調の定型表現（許容回数を超えたら指摘） ---
const AI_PHRASES = [
  { re: /ことができます/g, max: 1, fix: "「できます」に短縮" },
  { re: /と言えるでしょう/g, max: 1, fix: "断定を避けつつ簡潔に（〜とされます 等）" },
  { re: /重要です。/g, max: 2, fix: "何がなぜ重要かを具体に" },
  { re: /について見ていきましょう/g, max: 1, fix: "見出しに役割を持たせ本文は即内容へ" },
  { re: /いかがでしたか/g, max: 0, fix: "使用禁止（ブログ常套句）" },
  { re: /〜/g, max: 8, fix: "波ダッシュ多用は口語的" },
  { re: /また、/g, max: 4, fix: "接続詞「また」の多用。文を統合するか別の接続に" },
  { re: /非常に/g, max: 2, fix: "程度副詞の乱用。具体的な数字・事実で置換" },
  { re: /しっかりと?/g, max: 1, fix: "曖昧な強調。具体的な行動に置換" },
];
for (const p of AI_PHRASES) {
  const n = (body.match(p.re) || []).length;
  if (n > p.max) warn("AI調表現", `「${p.re.source}」${n}回（許容${p.max}）→ ${p.fix}`);
}

// --- 2. 文体混在（ですます / である） ---
const sentences = body
  .split("\n")
  .filter(l => !/^\s*[-*>|]/.test(l))          // 箇条書き・引用・表は文長判定から除外
  .join("\n")
  .split(/(?<=[。！？])|\n/)
  .map(s => s.trim())
  .filter(s => s.length > 5);
const desumasu = sentences.filter(s => /(です|ます|ません|でした|ましょう)[。！？]?$/.test(s)).length;
const dearu = sentences.filter(s => /(である|だ|た|る|い)[。！？]?$/.test(s) && !/(です|ます)[。！？]?$/.test(s)).length;
if (desumasu > 0 && dearu > 0) {
  const minority = Math.min(desumasu, dearu);
  const ratio = minority / (desumasu + dearu);
  if (ratio > 0.25) warn("文体混在", `ですます${desumasu}文 / である調${dearu}文。どちらかに統一（本サイトは「ですます」基調）`);
}

// --- 3. 長文検出 ---
for (const s of sentences) {
  if (s.length > 110) warn("長文", `${s.length}字: 「${s.slice(0, 40)}…」→ 2文に分割`);
}

// --- 4. 同一語尾の3連続 ---
const endings = sentences.map(s => (s.match(/(です|ます|ました|でしょう|ません)[。！？]?$/) || [])[1] || "");
for (let i = 0; i + 2 < endings.length; i++) {
  if (endings[i] && endings[i] === endings[i + 1] && endings[i] === endings[i + 2]) {
    warn("語尾単調", `「${endings[i]}」が3文連続（${i + 1}文目〜）。体言止め・語順変更などで変化を`);
    i += 2;
  }
}

// --- 5. 冗長・二重表現 ---
const REDUNDANT = [
  [/まず最初に/g, "「まず」だけで十分"],
  [/あらかじめ予測/g, "「予測」だけで十分"],
  [/後で後悔/g, "「後悔」だけで十分"],
  [/一番最初/g, "「最初」だけで十分"],
  [/必要不可欠/g, "「不可欠」だけで十分"],
];
for (const [re, fix] of REDUNDANT) {
  if (re.test(body)) warn("冗長表現", `「${re.source}」→ ${fix}`);
}

// --- スコアリング（パイプラインの合否判定用） ---
const score = Math.max(0, 100 - issues.length * 8);
const pass = score >= 70;

if (asJson) {
  console.log(JSON.stringify({ file, score, pass, issues }, null, 2));
} else {
  if (issues.length) {
    console.log(`\n📝 ${file} — スコア ${score}/100 ${pass ? "(合格)" : "(要改稿)"}`);
    issues.forEach(i => console.log(`  [${i.type}] ${i.detail}`));
  } else {
    console.log(`✅ ${file} — スコア 100/100`);
  }
}
process.exit(pass ? 0 : 1);
