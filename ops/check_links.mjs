#!/usr/bin/env node
/**
 * 出典リンクの死活監視（永続性）。週次 cron で実行推奨。
 * 失敗リンクは ops/link_report.md に書き出し、Hermes/人間の修正キューにする。
 * 使い方: node ops/check_links.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { spawnSync } from "node:child_process";
import { devNull } from "node:os";

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

// ブラウザUAで検査（素のHEADはJPX/JSTOR等がbot遮断で403を返し誤検知になる）
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
// CLIからのアクセスを全面遮断するサイト（ブラウザでは閲覧可・手動確認運用）
// jstor: 全面bot遮断 / doi.org: 転送先(Wiley等)がbot遮断。DOIは恒久識別子なので死活対象外
const BOT_BLOCKED = [/^https:\/\/www\.jstor\.org\//, /^https:\/\/doi\.org\//];

// node fetch(undici)が特定サイト(jsda等)でTLS相性により失敗するため、最終判定はcurlで行う
function curlStatus(url) {
  const r = spawnSync("curl", ["-sL", "-o", devNull, "-w", "%{http_code}", "-A", UA, "--max-time", "20", url], { encoding: "utf8" });
  return r.status === 0 ? Number(r.stdout.trim()) : 0;
}

const broken = [];
for (const [url, files] of urls) {
  if (BOT_BLOCKED.some((re) => re.test(url))) continue;
  let status;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
    status = res.status;
  } catch {
    status = 0;
  }
  if (status === 0 || status >= 400) status = curlStatus(url) || status || "FETCH_FAILED";
  if (status === "FETCH_FAILED" || status >= 400) broken.push({ url, status, files });
}

if (broken.length) {
  const report = ["# リンク切れレポート", `生成: ${new Date().toISOString()}`, ""];
  for (const b of broken) report.push(`- [${b.status}] ${b.url}\n  - 使用箇所: ${b.files.join(", ")}`);
  writeFileSync("ops/link_report.md", report.join("\n"));
  console.error(`❌ リンク切れ ${broken.length}件 -> ops/link_report.md`);
  process.exit(1);
}
console.log(`✅ 全${urls.size}リンク正常`);
