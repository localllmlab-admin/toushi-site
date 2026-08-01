/**
 * コンテンツの更新日を「URL → 日付」で引けるようにする（sitemap の lastmod 用）。
 *
 * astro.config.mjs の sitemap serialize から呼ぶため、Content Collections API ではなく
 * ファイルを直接読む（config段階では astro:content を使えない）。
 * slug は Astro の既定どおりファイル名とみなし、URLからファイルを逆引きして厳密に突き合わせる。
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = "src/content";
const COLLECTIONS = ["learn", "playbook", "charts", "glossary", "books"];

const frontmatterDate = (file) => {
  const raw = readFileSync(file, "utf8");
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  const fm = end < 0 ? raw : raw.slice(0, end);
  // updated（内容更新日）を採用。reviewedAt はレビュー日で、更新検知の意味では updated が正しい。
  const m = fm.match(/^updated:\s*["']?(\d{4}-\d{2}-\d{2})/m);
  if (!m) return null;
  const d = new Date(`${m[1]}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** URL（/learn/foo/ 等）→ Date。記事以外は null。 */
const byUrl = new Map();
/** 一覧ページ用: セクションごとの最新更新日 */
const sectionNewest = new Map();
let siteNewest = null;

for (const collection of COLLECTIONS) {
  const dir = join(CONTENT_DIR, collection);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    if (!/\.(md|mdx)$/.test(name)) continue;
    const file = join(dir, name);
    if (!statSync(file).isFile()) continue;
    const date = frontmatterDate(file);
    if (!date) continue;
    const slug = name.replace(/\.(md|mdx)$/, "");
    byUrl.set(`/${collection}/${slug}/`, date);
    if (!sectionNewest.has(collection) || date > sectionNewest.get(collection)) {
      sectionNewest.set(collection, date);
    }
    if (!siteNewest || date > siteNewest) siteNewest = date;
  }
}

/**
 * sitemap の lastmod として使う日付を返す。
 * - 記事ページ: その記事の updated
 * - セクション一覧: そのセクションで最も新しい updated
 * - トップ・テーマ別など横断ページ: サイト全体で最も新しい updated
 * ※ reviewed:false の記事はビルドされずsitemapにも載らないため、ここで拾っても影響しない。
 */
export function lastmodFor(absoluteUrl) {
  const path = absoluteUrl.replace(/^https?:\/\/[^/]+/, "");
  const own = byUrl.get(path);
  if (own) return own;
  const section = path.split("/")[1];
  return sectionNewest.get(section) ?? siteNewest ?? null;
}
