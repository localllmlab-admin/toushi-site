/**
 * 用語集辞書（用語⇔記事の自動相互リンクの単一ソース / WO-TOUSHI-002(a)）。
 * - src/content/glossary/*.md の frontmatter（term / reviewed）から辞書を構築する。
 * - 本文リンク化（rehype-glossary-links.mjs）と、用語ページの
 *   「この用語が出てくる記事」逆引き（glossary/[...slug].astro）の両方で同じ判定を使う。
 * - 日本語には単語境界がないため、隣接文字のスクリプト連続（カタカナ・漢字・英数）で
 *   複合語内の部分一致（例: ヘッジファンド内の「ヘッジ」）を除外する。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const GLOSSARY_DIR = join(process.cwd(), "src/content/glossary");

const KATAKANA = /[゠-ヺー]/; // カタカナ + 長音符
const KANJI = /[㐀-鿿々〇]/; // 漢字 + 々・〇
const ALNUM = /[A-Za-z0-9０-９]/;

/** term から本文照合キーを作る。読み仮名括弧は除去し、「・」複合語は分割形も許容する */
export function matchKeysOf(term) {
  const primary = term.replace(/（.+?）/g, "").trim();
  const keys = new Set();
  if (primary.length >= 2) keys.add(primary);
  if (primary.includes("・")) {
    for (const part of primary.split("・")) {
      if (part.length >= 3) keys.add(part); // 短すぎる分割形（例: 板）は誤リンク防止のため除外
    }
  }
  return [...keys].sort((a, b) => b.length - a.length); // 最長一致優先
}

/** text[start..end) のキー一致が語境界として妥当か（複合語の内部一致を弾く） */
export function boundaryOk(text, start, end) {
  const first = text[start];
  const last = text[end - 1];
  const prev = start > 0 ? text[start - 1] : "";
  const next = end < text.length ? text[end] : "";
  // 前後が英数字なら複合表記（例: 「4時間足」「NT倍率x」）とみなして除外
  if (prev && ALNUM.test(prev)) return false;
  if (next && ALNUM.test(next)) return false;
  // 同一スクリプトの連続（カタカナ語・漢字熟語の内部一致）を除外
  if (KATAKANA.test(first) && prev && KATAKANA.test(prev)) return false;
  if (KATAKANA.test(last) && next && KATAKANA.test(next)) return false;
  if (KANJI.test(first) && prev && KANJI.test(prev)) return false;
  if (KANJI.test(last) && next && KANJI.test(next)) return false;
  return true;
}

/** text 中の key の語境界一致の最初の位置。なければ -1 */
export function findMention(text, key, from = 0) {
  let idx = text.indexOf(key, from);
  while (idx !== -1) {
    if (boundaryOk(text, idx, idx + key.length)) return idx;
    idx = text.indexOf(key, idx + 1);
  }
  return -1;
}

/** いずれかのキーが語境界つきで含まれるか（逆引きブロック用） */
export function textMentions(text, keys) {
  return keys.some((k) => findMention(text, k) !== -1);
}

let cache = null;
/** 公開（reviewed:true）の用語辞書 [{ slug, term, keys }]（キー長い順） */
export function loadGlossaryDict() {
  if (cache) return cache;
  const entries = [];
  for (const f of readdirSync(GLOSSARY_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(GLOSSARY_DIR, f), "utf8");
    if (!/^reviewed:\s*true\s*$/m.test(raw)) continue; // 未公開用語へはリンクしない
    const m = raw.match(/^term:\s*"(.+?)"\s*$/m);
    if (!m) continue;
    const slug = f.replace(/\.md$/, "");
    const keys = matchKeysOf(m[1]);
    if (keys.length > 0) entries.push({ slug, term: m[1], keys });
  }
  // 最長キー優先で照合できるよう、代表キー長の降順に並べる
  cache = entries.sort((a, b) => b.keys[0].length - a.keys[0].length);
  return cache;
}
