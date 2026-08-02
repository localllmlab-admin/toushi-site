#!/usr/bin/env node
/**
 * IndexNow 送信（Bing / Yandex 等へ更新を通知）。
 *
 * これまで毎回その場でコマンドを組んでいたため、手順を固定してスクリプト化した。
 * 送信対象は dist/sitemap-*.xml の <loc> をそのまま使う（＝実際に配信しているURLだけを送る）。
 *
 * 使い方:
 *   node ops/indexnow.mjs                       # sitemapの全URL
 *   node ops/indexnow.mjs /learn/foo/ /books/   # 指定URLのみ
 *   node ops/indexnow.mjs --dry-run             # 送信せず対象だけ表示
 *
 * キーは public/<key>.txt として配信済みである必要がある（未配信だと 403）。
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const HOST = "toushi-manabiya.jp";
const SITE = `https://${HOST}`;
const DIST = "dist";
const ENDPOINT = "https://api.indexnow.org/indexnow";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const explicit = args.filter((a) => !a.startsWith("--"));

// キーは public/ に置かれた <32桁>.txt から読む（ファイル名とキー本文は一致させる規約）
const keyFile = readdirSync("public").find((f) => /^[0-9a-f]{8,128}\.txt$/.test(f));
if (!keyFile) throw new Error("public/ にIndexNowキーファイルが見つかりません");
const key = readFileSync(join("public", keyFile), "utf8").trim();
if (key !== keyFile.replace(/\.txt$/, "")) {
  throw new Error(`キーファイル名と中身が不一致: ${keyFile}`);
}

let urlList;
if (explicit.length) {
  urlList = explicit.map((u) => (u.startsWith("http") ? u : SITE + u));
} else {
  if (!existsSync(DIST)) throw new Error("dist/ がありません。先に npm run build を実行してください");
  urlList = readdirSync(DIST)
    .filter((f) => /^sitemap-\d+\.xml$/.test(f))
    .flatMap((f) => [...readFileSync(join(DIST, f), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
}
urlList = [...new Set(urlList)];
if (!urlList.length) throw new Error("送信対象URLが0件です");

console.log(`IndexNow: ${urlList.length}URL${dryRun ? "（--dry-run: 送信しません）" : ""}`);
if (dryRun) {
  for (const u of urlList.slice(0, 10)) console.log("  " + u);
  if (urlList.length > 10) console.log(`  …他 ${urlList.length - 10}件`);
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${keyFile}`, urlList }),
});
const body = await res.text();
console.log(`HTTP ${res.status} ${res.statusText}${body ? ` / ${body.slice(0, 200)}` : ""}`);
// 200/202 が受理。403 はキー未配信、422 はURLとhostの不一致。
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
