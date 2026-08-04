#!/usr/bin/env node
/**
 * SEO機械検査（dist/ のビルド成果物を対象）
 *
 * 思想: ソースではなく「配信されるHTML」を数える。
 * ビルド緑・lint緑でも本番HTMLが壊れている事故が過去に複数あったため
 * （enum変更で一覧0件・生**残存・空ページ等）、検査対象は必ず dist。
 *
 * 使い方:
 *   npm run build && node ops/check_seo.mjs
 *   node ops/check_seo.mjs --json   # 機械可読出力
 *
 * 終了コード: 重大(ERROR)が1件でもあれば 1。
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const DIST = "dist";
const SITE = "https://toushi-manabiya.jp";
const asJson = process.argv.includes("--json");

// SERPでの表示幅の目安（日本語）。全角=2、半角=1として数える。
const width = (s) => [...s].reduce((n, c) => n + (/[\x00-ÿ]/.test(c) ? 1 : 2), 0);
// 閾値は勘ではなく「実際に切られる位置」に合わせる。
const TITLE_MAX = 64; // 全角32字相当（PC・SPともこのあたりで省略される）
const DESC_MIN = 80;  // 全角40字相当。これ未満は情報量不足
// descriptionはPCで全角120字前後まで表示される。SPは全角70字前後で切れるため、
// 長さそのものより「要点を前半に置く」ことが効く。ここではPC基準で検査する。
const DESC_MAX = 240; // 全角120字相当

// titleは「区切り記号より前の主題部」がSERPに残るかどうかが本質。
// 副題まで含めた全長が閾値を超えても、主題が読める限り実害はない（むしろ自前で削ると
// title内のキーワードを失う）ため、主題部＋サイト名の幅で測る。
const titleHead = (t) => {
  const [head, ...rest] = t.split("｜");
  const site = rest.length ? `｜${rest[rest.length - 1]}` : "";
  return head.split(/[―—–:：]/)[0].trim() + site;
};

// --- dist の HTML を収集 -------------------------------------------------
const htmlFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "pagefind" || name === "_astro") continue;
      walk(p);
    } else if (name.endsWith(".html")) htmlFiles.push(p);
  }
})(DIST);

const urlOf = (file) => {
  const rel = relative(DIST, file).split(sep).join("/");
  return "/" + rel.replace(/index\.html$/, "").replace(/\.html$/, "/");
};

const pick = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };
const decode = (s) =>
  s == null ? s : s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                   .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const pages = htmlFiles.map((file) => {
  const html = readFileSync(file, "utf8");
  const head = html.slice(0, html.indexOf("</head>") + 7);
  const ldRaw = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  // パース不能なJSON-LDは「無い」のと同じ（検索エンジンに丸ごと無視される）。
  // 黙って捨てると、他に1ブロックでもあるページで壊れたブロックを見逃すので件数を持つ。
  let ldBroken = 0;
  const jsonLd = ldRaw
    .map((m) => { try { return JSON.parse(m[1]); } catch { ldBroken++; return null; } })
    .filter(Boolean);
  const bodyStart = html.indexOf("<main");
  const bodyEnd = html.indexOf("</main>");
  const main = bodyStart >= 0 && bodyEnd > bodyStart ? html.slice(bodyStart, bodyEnd) : html;
  return {
    file,
    url: urlOf(file),
    html,
    main,
    title: decode(pick(head, /<title>([\s\S]*?)<\/title>/)),
    description: decode(pick(head, /<meta name="description" content="([\s\S]*?)"/)),
    canonical: pick(head, /<link rel="canonical" href="([^"]*)"/),
    ogImage: pick(head, /<meta property="og:image" content="([^"]*)"/),
    ogType: pick(head, /<meta property="og:type" content="([^"]*)"/),
    robots: pick(head, /<meta name="robots" content="([^"]*)"/),
    h1: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]*>/g, "").trim()),
    headings: [...main.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1])),
    // ヘッダー・フッターは <main> の外にある。ここを検査対象から外すと、共通ナビの
    // リンクを1文字壊しても全ページ「指摘なし」になる。リンクと画像はページ全体から拾う
    // （見出し階層だけは本文の構造を見たいので main 内のままにする）。
    imgs: [...html.matchAll(/<img\b([^>]*)>/g)].map((m) => m[1]),
    // @type は配列（多重型: Article + LearningResource 等）を取りうるので平坦化して持つ
    jsonLdTypes: jsonLd.flatMap((b) => (Array.isArray(b["@type"]) ? b["@type"] : [b["@type"]])),
    jsonLd,
    ldBroken,
    links: [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]),
  };
});

// --- 検査 ---------------------------------------------------------------
const findings = [];
const add = (level, rule, msg, items = []) => findings.push({ level, rule, msg, items });

// 1. title / description
const byTitle = new Map(), byDesc = new Map();
const noDesc = [], longTitle = [], shortDesc = [], longDesc = [];
for (const p of pages) {
  if (!p.title) add("ERROR", "title-missing", `titleがない: ${p.url}`);
  else {
    byTitle.set(p.title, [...(byTitle.get(p.title) ?? []), p.url]);
    const headW = width(titleHead(p.title));
    if (headW > TITLE_MAX) longTitle.push(`${p.url} 主題部${headW} / 全体${width(p.title)}`);
  }
  if (!p.description) noDesc.push(p.url);
  else {
    byDesc.set(p.description, [...(byDesc.get(p.description) ?? []), p.url]);
    if (width(p.description) < DESC_MIN) shortDesc.push(`${p.url} (${width(p.description)})`);
    if (width(p.description) > DESC_MAX) longDesc.push(`${p.url} (${width(p.description)})`);
  }
}
for (const [t, urls] of byTitle) if (urls.length > 1) add("ERROR", "title-duplicate", `title重複「${t}」`, urls);
for (const [d, urls] of byDesc) if (urls.length > 1) add("ERROR", "description-duplicate", `description重複「${d.slice(0, 40)}…」`, urls);
if (noDesc.length) add("ERROR", "description-missing", `descriptionがないページ ${noDesc.length}件`, noDesc);
if (longTitle.length) add("WARN", "title-too-long", `titleの主題部が全角32字超＝SERPで主題そのものが切れる ${longTitle.length}件`, longTitle);
if (shortDesc.length) add("WARN", "description-short", `descriptionが全角40字未満 ${shortDesc.length}件`, shortDesc);
if (longDesc.length) add("WARN", "description-long", `descriptionが全角120字超＝PCのSERPでも切れる ${longDesc.length}件`, longDesc);

// 2. canonical（自己参照であること）
const badCanonical = pages.filter((p) => !p.canonical || p.canonical !== SITE + p.url).map((p) => `${p.url} → ${p.canonical}`);
if (badCanonical.length) add("ERROR", "canonical", `canonicalが自己参照でない ${badCanonical.length}件`, badCanonical);

// 3. h1
const noH1 = pages.filter((p) => p.h1.length === 0).map((p) => p.url);
const multiH1 = pages.filter((p) => p.h1.length > 1).map((p) => `${p.url} (${p.h1.length})`);
if (noH1.length) add("ERROR", "h1-missing", `h1がないページ ${noH1.length}件`, noH1);
if (multiH1.length) add("WARN", "h1-multiple", `h1が複数あるページ ${multiH1.length}件`, multiH1);

// 4. 見出し階層の飛び（h2 → h4 等）
const skipped = [];
for (const p of pages) {
  let prev = 0;
  for (const h of p.headings) {
    if (prev && h > prev + 1) { skipped.push(`${p.url} (h${prev}→h${h})`); break; }
    prev = h;
  }
}
if (skipped.length) add("WARN", "heading-skip", `見出しレベルが飛んでいる ${skipped.length}件`, skipped);

// 5. img の alt
const noAlt = [];
for (const p of pages) for (const attrs of p.imgs) if (!/\salt=/.test(attrs)) noAlt.push(p.url);
if (noAlt.length) add("ERROR", "img-alt", `alt属性のないimg ${noAlt.length}件`, [...new Set(noAlt)]);

// 6. OGP画像の実在
const missingOg = [];
for (const p of pages) {
  if (!p.ogImage) { missingOg.push(`${p.url} (og:imageなし)`); continue; }
  const path = p.ogImage.replace(SITE, "");
  if (!existsSync(join(DIST, path))) missingOg.push(`${p.url} → ${path} が存在しない`);
}
if (missingOg.length) add("ERROR", "og-image", `og:imageが欠落/不在 ${missingOg.length}件`, missingOg);

// 7. 内部リンク切れ（dist内にファイルがない内部リンク）
const exists = (u) => {
  const path = u.split("#")[0].split("?")[0];
  if (!path.startsWith("/")) return true;
  // ディレクトリが在るだけでは配信されない（nginx: try_files $uri $uri/ =404）。
  // 一覧ページの生成が失敗しても配下記事でディレクトリは残るため、必ず実ファイルを見る。
  if (existsSync(join(DIST, path, "index.html"))) return true;
  if (existsSync(join(DIST, path.replace(/\/$/, "") + ".html"))) return true;
  const direct = join(DIST, path);
  return existsSync(direct) && statSync(direct).isFile();
};
const broken = new Set();
for (const p of pages) for (const l of p.links) {
  if (!l.startsWith("/") || l.startsWith("//")) continue;
  if (!exists(l)) broken.add(`${p.url} → ${l}`);
}
if (broken.size) add("ERROR", "internal-link", `内部リンク切れ ${broken.size}件`, [...broken]);

// 8. 孤立ページ（サイト内のどこからもリンクされていない）
const inbound = new Set();
for (const p of pages) for (const l of p.links) {
  const path = l.split("#")[0].split("?")[0];
  if (path.startsWith("/") && !path.startsWith("//")) inbound.add(path.endsWith("/") ? path : path + "/");
}
const orphans = pages.filter((p) => p.url !== "/" && !p.robots?.includes("noindex") && !inbound.has(p.url)).map((p) => p.url);
if (orphans.length) add("WARN", "orphan-page", `内部リンクが1本もないページ ${orphans.length}件`, orphans);

// 9. sitemap
const smIndex = join(DIST, "sitemap-index.xml");
if (!existsSync(smIndex)) add("ERROR", "sitemap", "sitemap-index.xml がない");
else {
  const files = [...readFileSync(smIndex, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  let locs = [], lastmods = 0;
  for (const f of files) {
    const local = join(DIST, f.replace(SITE, ""));
    if (!existsSync(local)) { add("ERROR", "sitemap", `sitemapの参照先がない: ${f}`); continue; }
    const xml = readFileSync(local, "utf8");
    locs.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    lastmods += [...xml.matchAll(/<lastmod>/g)].length;
  }
  const inSitemap = new Set(locs.map((l) => l.replace(SITE, "")));
  const notListed = pages.filter((p) => !inSitemap.has(p.url) && !p.robots?.includes("noindex")).map((p) => p.url);
  if (notListed.length) add("WARN", "sitemap-missing-page", `sitemapに載っていないページ ${notListed.length}件`, notListed);
  // 逆方向: noindex のページを sitemap に載せると GSC で「送信されたURLにnoindexタグが追加されています」
  // としてエラー計上される。noindex 指定と sitemap の filter は必ず一緒に更新する。
  const noindexListed = pages.filter((p) => p.robots?.includes("noindex") && inSitemap.has(p.url)).map((p) => p.url);
  if (noindexListed.length) add("ERROR", "sitemap-noindex", `noindexなのにsitemapに載っているページ ${noindexListed.length}件`, noindexListed);
  // lastmod はURLごとに省略できる。根拠のない日付を入れるより出さない方が正しいので、
  // 「一部にしかない」は正常。全く無い場合＝lastmodを出す仕組み自体が壊れた場合だけ指摘する。
  if (lastmods === 0) add("WARN", "sitemap-lastmod", `sitemapに <lastmod> が1件もない（${locs.length}URL）`);
}

// 10. 構造化データ
const noJsonLd = pages.filter((p) => p.jsonLdTypes.length === 0 && !p.robots?.includes("noindex")).map((p) => p.url);
if (noJsonLd.length) add("WARN", "jsonld-missing", `構造化データ(JSON-LD)がないページ ${noJsonLd.length}件`, noJsonLd);
const home = pages.find((p) => p.url === "/");
if (home) {
  for (const t of ["WebSite", "Organization"]) {
    if (!home.jsonLdTypes.includes(t)) add("WARN", "jsonld-site", `トップページに ${t} 構造化データがない`);
  }
}

const ldBroken = pages.filter((p) => p.ldBroken > 0).map((p) => `${p.url} (${p.ldBroken}件)`);
if (ldBroken.length) add("ERROR", "jsonld-parse", `JSON-LDがJSONとして壊れている ${ldBroken.length}ページ`, ldBroken);

// 11. 404ページ
if (!existsSync(join(DIST, "404.html"))) add("WARN", "404-page", "404.html が生成されていない（Nginxの既定404が出る）");

// 12. robots メタのディレクティブ
// 指定しないと保守的な既定（画像プレビューはstandard＝小サイズ、スニペット長も制限）になる。
// max-image-preview:large は Discover / SERP のサムネイル表示に効くので全ページ必須とする。
const noRobots = pages.filter((p) => !p.robots).map((p) => p.url);
if (noRobots.length) add("WARN", "robots-meta-missing", `robotsメタがないページ ${noRobots.length}件`, noRobots);
const weakPreview = pages
  .filter((p) => p.robots && !p.robots.includes("noindex") && !p.robots.includes("max-image-preview:large"))
  .map((p) => `${p.url} → ${p.robots}`);
if (weakPreview.length) add("WARN", "robots-image-preview", `max-image-preview:large がないページ ${weakPreview.length}件`, weakPreview);

// 13. 記事ページの前後ナビ（連続した読み順＝クロール経路と回遊導線）
// 本文にリンクがない記事でも最低限の文脈リンクが入ることを不変条件にする。
const articlePages = pages.filter((p) => /^\/(learn|playbook|charts|glossary|books)\/[^/]+\/$/.test(p.url));
const noSeq = articlePages.filter((p) => !/<nav class="seq"/.test(p.html)).map((p) => p.url);
if (noSeq.length) add("WARN", "sequence-nav", `前後ナビがない記事 ${noSeq.length}件 / 全${articlePages.length}件`, noSeq);

// 14. robots.txt
const robotsTxt = join(DIST, "robots.txt");
if (!existsSync(robotsTxt)) add("ERROR", "robots-txt", "robots.txt がない");
else if (!readFileSync(robotsTxt, "utf8").includes("Sitemap:")) add("ERROR", "robots-txt", "robots.txt に Sitemap 行がない");

// --- 出力 ---------------------------------------------------------------
const order = { ERROR: 0, WARN: 1 };
findings.sort((a, b) => order[a.level] - order[b.level]);
if (asJson) {
  console.log(JSON.stringify({ pages: pages.length, findings }, null, 2));
} else {
  console.log(`SEO機械検査: ${pages.length}ページ / 指摘 ${findings.length}件\n`);
  for (const f of findings) {
    console.log(`[${f.level}] ${f.rule}: ${f.msg}`);
    for (const it of f.items.slice(0, 12)) console.log(`    - ${it}`);
    if (f.items.length > 12) console.log(`    …他 ${f.items.length - 12}件`);
  }
  if (!findings.length) console.log("指摘なし");
}
process.exit(findings.some((f) => f.level === "ERROR") ? 1 : 0);
