#!/usr/bin/env node
/**
 * 出典リンクの死活監視（永続性）。週次 cron で実行推奨。
 * 失敗リンクは ops/link_report.md に書き出し、Hermes/人間の修正キューにする。
 * 使い方: node ops/check_links.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const urls = new Map(); // url -> [files]
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if ([".md", ".mdx"].includes(extname(p))) {
      const raw = readFileSync(p, "utf8");
      for (const m of raw.matchAll(/https?:\/\/[^\s"')\]]+/g)) {
        const u = m[0].replace(/[.,;:]$/, "");
        if (!urls.has(u)) urls.set(u, []);
        urls.get(u).push(p);
      }
    }
  }
}
walk("src/content");

const broken = [];
for (const [url, files] of urls) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
    if (res.status >= 400) broken.push({ url, status: res.status, files });
  } catch (e) {
    broken.push({ url, status: e.name, files });
  }
}

if (broken.length) {
  const report = ["# リンク切れレポート", `生成: ${new Date().toISOString()}`, ""];
  for (const b of broken) report.push(`- [${b.status}] ${b.url}\n  - 使用箇所: ${b.files.join(", ")}`);
  writeFileSync("ops/link_report.md", report.join("\n"));
  console.error(`❌ リンク切れ ${broken.length}件 -> ops/link_report.md`);
  process.exit(1);
}
console.log(`✅ 全${urls.size}リンク正常`);
