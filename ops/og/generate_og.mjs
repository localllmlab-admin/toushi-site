#!/usr/bin/env node
/**
 * OGP画像ジェネレーター（ビルド外・ローカル実行・成果物はgitコミット）。
 * - 出力: public/og/<collection>-<slug>.jpg（1200x630・q85）+ default.jpg
 * - レンダラ: Playwright Chromium（satoriはCJKフォント同梱が重いため採用しない）
 * - デザイン: tokens.css v4「罫線帳と赤ペン」準拠（方眼の紙・墨藍の明朝タイトル・朱の傍線・カテゴリ色の札）
 *   見出し書体は Google Fonts の text= で「その画像に出る文字だけ」を取り寄せる（要ネット接続）
 * - べき等: ops/og/manifest.json にタイトルのハッシュを記録し、変更がなければスキップ
 * 使い方: node ops/og/generate_og.mjs   （--force で全再生成 / --only=default,learn-xxx でパイロット）
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
  charts: { label: "チャート図解", color: "#96600c" },
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

// デザインを変えたら DESIGN を上げる（全画像がタイトル不変でも再生成される）
const DESIGN = "v4";
const hash = (s) => createHash("sha1").update(DESIGN + s).digest("hex").slice(0, 12);
const force = process.argv.includes("--force");
let manifest = {};
try { manifest = JSON.parse(readFileSync(MANIFEST, "utf8")); } catch {}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const SITE = "投資の学び舎";
const TAG = "相場を、正しく学ぶ。";
const html = ({ title, sub, cat }) => {
  // 明朝はこの画像に出る文字だけを取得（数KB）。等幅はドメイン表記用
  const chars = [...new Set(SITE + title + "0123456789")].join("");
  const fontCss = `https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&text=${encodeURIComponent(chars)}&display=block`;
  const size = title.length <= 22 ? 66 : title.length <= 38 ? 56 : 48;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${fontCss}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=block">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background:
      linear-gradient(#e2ebf4 1px, transparent 1px) 0 0 / 30px 30px,
      linear-gradient(90deg, #e2ebf4 1px, transparent 1px) 0 0 / 30px 30px,
      #fbfcfd;
    font-family: "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", sans-serif;
    color: #142340; display: flex; flex-direction: column; padding: 60px 72px 0;
  }
  .brand { display: flex; align-items: center; gap: 16px; }
  .site { font-family: "Shippori Mincho B1", "Yu Mincho", serif; font-size: 34px; font-weight: 800; letter-spacing: .06em; }
  .read { font-family: "IBM Plex Mono", monospace; font-size: 13px; letter-spacing: .34em; color: #56627a; margin-left: 4px; }
  .cat { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 700; color: ${cat ? cat.color : "#142340"};
    background: #fff; border: 1.5px solid #c9d8e8; border-radius: 6px; padding: 8px 18px; }
  .cat i { width: 14px; height: 14px; border-radius: 3px; background: ${cat ? cat.color : "#c23a26"}; display: block; }
  .main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding-bottom: 20px; }
  .rule { width: 84px; height: 6px; background: #c23a26; margin-bottom: 26px; border-radius: 1px; }
  .title {
    font-family: "Shippori Mincho B1", "Yu Mincho", serif; font-weight: 800;
    font-size: ${size}px; line-height: 1.42; letter-spacing: 0; font-feature-settings: "palt";
    display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
  }
  .sub { font-size: 26px; color: #1f2a3d; line-height: 1.7; margin-top: 20px; }
  .foot {
    height: 84px; margin: 0 -72px; padding: 0 72px; background: #142340; color: #eef3fa;
    display: flex; align-items: center; gap: 24px; font-size: 22px; font-weight: 700; letter-spacing: .08em;
  }
  .domain { margin-left: auto; font-family: "IBM Plex Mono", monospace; font-weight: 400; font-size: 20px; color: #a9b8d0; letter-spacing: .02em; }
</style></head><body>
  <div class="brand">
    <svg width="54" height="54" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#142340"/><path d="M8 0v32M16 0v32M24 0v32M0 8h32M0 16h32M0 24h32" stroke="#fff" stroke-opacity=".09"/><path d="M11.5 7v18" stroke="#6f9ad6" stroke-width="1.6" stroke-linecap="round"/><rect x="8.5" y="11" width="6" height="9" rx="1" fill="#6f9ad6"/><path d="M21 6v19" stroke="#e2574a" stroke-width="1.6" stroke-linecap="round"/><rect x="18" y="9" width="6" height="11" rx="1" fill="#e2574a"/></svg>
    <span class="site">${SITE}</span><span class="read">MANABIYA</span>
    <span class="cat"><i></i>${cat ? cat.label : "投資・トレードの教科書サイト"}</span>
  </div>
  <div class="main">
    <div class="rule"></div>
    <div class="title">${esc(title)}</div>
    ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
  </div>
  <div class="foot"><span>${cat ? TAG : "投資・トレードを基礎から、出典付きで。"}</span><span class="domain">toushi-manabiya.jp</span></div>
</body></html>`;
};

// --only=name1,name2 で指定分だけ生成（デザイン変更時のパイロット確認用。manifest は更新しない）
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const todo = only
  ? jobs.filter((j) => only.includes(j.name))
  : jobs.filter((j) => force || manifest[j.name] !== hash(j.title + (j.sub ?? "")));
console.log(`OGP: ${jobs.length}件中 ${todo.length}件を生成`);
if (todo.length > 0) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const j of todo) {
    await page.setContent(html(j), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${OUT}/${j.name}.jpg`, type: "jpeg", quality: 85 });
    if (!only) manifest[j.name] = hash(j.title + (j.sub ?? ""));
    console.log(`✔ ${j.name}.jpg`);
  }
  await browser.close();
  if (!only) writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
}
console.log("done");
