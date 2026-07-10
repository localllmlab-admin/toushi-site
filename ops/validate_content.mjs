#!/usr/bin/env node
/**
 * コンテンツ検証リンター v2（CI必須）。
 * 検査項目：
 *  1. 禁止表現（断定・射幸・推奨）／インサイダー示唆（教育文脈以外）
 *  2. 出典等級：A/B/C（公的・学術・一次発表）を最低1件
 *  3. reviewed:true なのに reviewedAt が無い → エラー
 *  4. 鮮度監査：reviewedAt から 365日超 → 警告（--strict でエラー）
 *  5. 再現性：playbook の「手法」「定石」は
 *     「## 前提条件」「## 検証の考え方」「## 限界と注意」の3見出し必須
 * 使い方: node ops/validate_content.mjs [--strict]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const CONTENT_DIR = "src/content";
const STRICT = process.argv.includes("--strict");
const STALE_DAYS = 365;

const HARD_BANS = [
  /必ず(儲|もう)かる/, /確実に(儲|勝)/, /絶対(儲|勝|に上がる|に下がる)/,
  /元本保証/, /誰でも稼げる/, /今すぐ買え/, /今が買い時だ/, /100%勝て/,
  /損しない方法/, /月利\d+%保証/,
];
const INSIDER_FLAG = /(未公表|未発表)の(重要事実|決算|材料).*(教える|入手|流す|使って)/;
const EDU_CONTEXT = /(規制|禁止|違反|注意|リスク|一般に|とされる|解説|とは|仕組み|歴史)/;

// 再現性必須セクション（playbook: 手法・定石）
const REPRO_SECTIONS = ["## 前提条件", "## 検証の考え方", "## 限界と注意"];

let errors = [];
let warnings = [];
let checked = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if ([".md", ".mdx"].includes(extname(p))) check(p);
  }
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const y = m[1];
  const fm = {};
  const get = (k) => (y.match(new RegExp(`^${k}:\\s*(.*)$`, "m")) || [])[1]?.trim();
  fm.title = get("title");
  fm.updated = get("updated");
  fm.reviewed = get("reviewed") === "true";
  fm.reviewedAt = get("reviewedAt");
  fm.kind = get("kind")?.replace(/["']/g, "");
  fm.isPR = get("isPR") === "true";
  // 等級付き出典: "grade: A" 形式の行を数える（E=当サイト編集部調べ・リンクなし）
  fm.gradesABC = (y.match(/grade:\s*["']?[ABC]["']?/g) || []).length;
  fm.gradesE = (y.match(/grade:\s*["']?E["']?/g) || []).length;
  fm.gradesAll = (y.match(/grade:\s*["']?[ABCDE]["']?/g) || []).length;
  // 広告リンク: sources[].ad: true の件数（ADR-0003 / PR表記の強制に使用）
  fm.adLinks = (y.match(/^\s*ad:\s*true\s*$/gm) || []).length;
  return fm;
}

function check(path) {
  checked++;
  const raw = readFileSync(path, "utf8");
  const fm = parseFrontmatter(raw);
  const body = raw.replace(/^---\n[\s\S]*?\n---/, "");

  if (!fm) { errors.push(`${path}: frontmatter がありません`); return; }
  if (!fm.title) errors.push(`${path}: title 必須`);
  if (!fm.updated) errors.push(`${path}: updated 必須`);

  // 出典等級：A/B/C を最低1件。該当する一次資料ページが実在しない場合のみ E（編集部調べ）で明示する
  // （リンク先に記事のないこじつけ出典は禁止・Masaru指示 2026-07-10）。Dのみは不可＝報道の引き写し防止
  if (fm.gradesAll < 1) errors.push(`${path}: 等級付き出典(sources[].grade)が必要`);
  else if (fm.gradesABC < 1 && fm.gradesE < 1)
    errors.push(`${path}: 等級A/B/C（公的・学術・一次発表）の出典、なければE（編集部調べ）を最低1件`);

  // 広告リンク（ad:true）を含むページは isPR:true を強制（PR表記の機械挿入・ADR-0003）
  // → PR表記なしのアフィリリンクをビルド前に遮断する（ステマ規制対応）
  if (fm.adLinks > 0 && !fm.isPR)
    errors.push(`${path}: 広告リンク(sources[].ad:true)があるページは isPR: true 必須（PR表記強制）`);

  // レビュー整合性・鮮度
  if (fm.reviewed && !fm.reviewedAt)
    errors.push(`${path}: reviewed:true なら reviewedAt（レビュー日）必須`);
  if (fm.reviewedAt) {
    const age = (Date.now() - new Date(fm.reviewedAt).getTime()) / 86400000;
    if (age > STALE_DAYS) {
      const msg = `${path}: レビューから${Math.floor(age)}日経過。再レビュー要（永続性ポリシー）`;
      STRICT ? errors.push(msg) : warnings.push(msg);
    }
  }

  // 禁止表現
  for (const re of HARD_BANS) if (re.test(body)) errors.push(`${path}: 禁止表現 -> ${re}`);

  // インサイダー示唆（教育文脈以外）
  const im = body.match(INSIDER_FLAG);
  if (im) {
    const around = body.slice(Math.max(0, im.index - 80), im.index + 120);
    if (!EDU_CONTEXT.test(around))
      errors.push(`${path}: インサイダー示唆の疑い（規制解説の文脈にすること）`);
  }

  // 再現性：手法・定石は3セクション必須
  if (path.includes("/playbook/") && ["手法", "定石"].includes(fm.kind)) {
    for (const sec of REPRO_SECTIONS) {
      if (!body.includes(sec))
        errors.push(`${path}: 再現性セクション「${sec}」が必要（kind:${fm.kind}）`);
    }
  }
}

walk(CONTENT_DIR);

if (warnings.length) {
  console.warn(`\n⚠️  警告（${warnings.length}件）`);
  warnings.forEach((w) => console.warn("  - " + w));
}
if (errors.length) {
  console.error(`\n❌ 検証失敗（${errors.length}件 / ${checked}ファイル）\n`);
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log(`✅ 検証OK（${checked}ファイル / 警告${warnings.length}件）`);
