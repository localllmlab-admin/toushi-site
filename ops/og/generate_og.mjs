#!/usr/bin/env node
/**
 * OGP画像ジェネレーター（ビルド外・ローカル実行・成果物はgitコミット）。
 * - 出力: public/og/<collection>-<slug>.jpg（1200x630・q85）+ default.jpg
 * - レンダラ: Playwright Chromium（satoriはCJKフォント同梱が重いため採用しない）
 * - デザイン: tokens.css v3 準拠（ブランド青グラデ・白タイトル・カテゴリ色チップ・OSフォント）
 * - べき等: ops/og/manifest.json にタイトルのハッシュを記録し、変更がなければスキップ
 * 使い方: node ops/og/generate_og.mjs   （--force で全再生成）
 * 注意: VPSビルドでは実行しない。Article.astro側はファイル存在チェックで default.jpg にフォールバックする。
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const OUT = "public/og";
const MANIFEST = "ops/og/manifest.json";
mkdirSync(OUT, { recursive: true });

const CATS = {
  learn: { label: "学ぶ", color: "#2b4a8b" },
  playbook: { label: "手法・定石", color: "#1f6e50" },
  charts: { label: "チャート図解", color: "#a3690f" },
  glossary: { label: "用語集", color: "#6b4fa0" },
  books: { label: "おすすめ書籍", color: "#8e3b46" },
};

// frontmatter から title を抜く（依存なしの最小パーサ）
const titleOf = (md) => {
  const m = md.match(/^title:\s*"(.+?)"\s*$/m);
  return m ? m[1] : null;
};

const jobs = [];
for (const col of Object.keys(CATS)) {
  const dir = `src/content/${col}`;
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const slug = f.replace(/\.md$/, "");
    const title = titleOf(readFileSync(`${dir}/${f}`, "utf8"));
    if (title) jobs.push({ name: `${col}-${slug}`, title, cat: CATS[col] });
  }
}
jobs.push({
  name: "default",
  title: "相場を、正しく学ぶ。",
  sub: "煽らず、断定せず、一次情報に基づいて。レベル別・出典付きの投資学習サイト",
  cat: null,
});

const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const force = process.argv.includes("--force");
let manifest = {};
try { manifest = JSON.parse(readFileSync(MANIFEST, "utf8")); } catch {}

const html = ({ title, sub, cat }) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: linear-gradient(135deg, #004f86 0%, #0075c2 55%, #00a5e3 100%);
    font-family: "BIZ UDPGothic", "Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", sans-serif;
    color: #fff; display: flex; flex-direction: column; padding: 64px 72px 56px;
  }
  .brand { display: flex; align-items: center; gap: 18px; }
  .mark {
    width: 56px; height: 56px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, #16355e, #2b4a8b);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; font-weight: 800; border: 2px solid rgba(255,255,255,.55);
  }
  .site { font-size: 32px; font-weight: 800; letter-spacing: .02em; }
  .site small { font-size: 18px; font-weight: 700; opacity: .85; margin-left: 12px; letter-spacing: .18em; }
  .title {
    flex: 1; display: flex; align-items: center;
    font-size: ${title.length > 34 ? 54 : 62}px; font-weight: 800; line-height: 1.42; letter-spacing: .01em;
    text-shadow: 0 2px 14px rgba(0,40,80,.35);
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    align-content: center; padding: 24px 0;
  }
  .sub { font-size: 26px; opacity: .92; line-height: 1.6; margin-top: -14px; padding-bottom: 22px; }
  .foot { display: flex; align-items: center; gap: 20px; font-size: 22px; font-weight: 700; }
  .chip { background: ${cat ? cat.color : "#16355e"}; border: 1.5px solid rgba(255,255,255,.6);
    border-radius: 8px; padding: 8px 22px; font-size: 24px; font-weight: 800; }
  .domain { margin-left: auto; opacity: .9; font-family: Consolas, monospace; font-weight: 400; }
</style></head><body>
  <div class="brand"><div class="mark">学</div><div class="site">投資の学び舎<small>まなびや</small></div></div>
  <div class="title">${title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div>
  ${sub ? `<div class="sub">${sub}</div>` : ""}
  <div class="foot">${cat ? `<span class="chip">${cat.label}</span>` : `<span class="chip">投資教育サイト</span>`}<span>相場を、正しく学ぶ。</span><span class="domain">toushi-manabiya.jp</span></div>
</body></html>`;

const todo = jobs.filter((j) => force || manifest[j.name] !== hash(j.title + (j.sub ?? "")));
console.log(`OGP: ${jobs.length}件中 ${todo.length}件を生成`);
if (todo.length > 0) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const j of todo) {
    await page.setContent(html(j), { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/${j.name}.jpg`, type: "jpeg", quality: 85 });
    manifest[j.name] = hash(j.title + (j.sub ?? ""));
    console.log(`✔ ${j.name}.jpg`);
  }
  await browser.close();
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
}
console.log("done");
