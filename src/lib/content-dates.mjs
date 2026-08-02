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
  // reviewed:false はビルドされず公開もされない。集計に混ぜると、公開内容が
  // 1文字も変わっていないURLの lastmod までドラフトの日付に動いてしまう。
  if (!/^reviewed:\s*true\s*$/m.test(fm)) return null;
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
  }
}

/**
 * sitemap の lastmod として使う日付を返す。
 * - 記事ページ: その記事の updated
 * - セクション一覧（/learn/ 等）: そのセクションで最も新しい updated
 * - それ以外（トップ・/topics/*・/policy/・/search/）: null＝lastmodを出さない
 *
 * 横断ページにサイト全体の最新日を入れると、記事を1本足しただけで /policy/ の
 * lastmod まで動く。それは astro.config が避けたい「毎回のデプロイで全URLが更新扱い」と
 * 実質同じで、明らかに不正確な lastmod は無視されてシグナルそのものを失う。
 * lastmod はURLごとに省略できるので、根拠のないページには付けない。
 */
export function lastmodFor(absoluteUrl) {
  const path = absoluteUrl.replace(/^https?:\/\/[^/]+/, "");
  const own = byUrl.get(path);
  if (own) return own;
  const m = path.match(/^\/([^/]+)\/$/);
  return m ? sectionNewest.get(m[1]) ?? null : null;
}
