#!/usr/bin/env node
/**
 * src/diagrams/*.mmd を public/diagrams/<name>.svg にビルド時変換するスクリプト。
 *
 * mermaid-cli（@mermaid-js/mermaid-cli）は package.json の依存に追加しない。
 * npx 経由でオンデマンド実行することで、ビルド必須経路（npm run build）から切り離す。
 * 実行環境に mermaid-cli が無い／npx が失敗しても、public/diagrams に既存のSVGが
 * あればビルド自体は通る設計（Mermaid.astro は生成済みSVGを参照するだけ）。
 *
 * 使い方: node ops/render_diagrams.mjs
 */
import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, basename, extname } from "node:path";

const SRC_DIR = "src/diagrams";
const OUT_DIR = "public/diagrams";

if (!existsSync(SRC_DIR)) {
  console.log(`${SRC_DIR} が存在しません。スキップします。`);
  process.exit(0);
}

const files = readdirSync(SRC_DIR).filter((f) => extname(f) === ".mmd");
if (files.length === 0) {
  console.log("変換対象の .mmd がありません。");
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });

let failed = 0;
for (const file of files) {
  const name = basename(file, ".mmd");
  const inPath = join(SRC_DIR, file);
  const outPath = join(OUT_DIR, `${name}.svg`);
  console.log(`変換中: ${inPath} -> ${outPath}`);
  try {
    // Windows/mac/linux 共通で npx を呼べるよう shell 経由で実行する。
    execFileSync(
      "npx",
      ["-y", "@mermaid-js/mermaid-cli", "-i", inPath, "-o", outPath, "-b", "transparent"],
      { stdio: "inherit", shell: true }
    );
  } catch (e) {
    failed++;
    console.error(`❌ ${file} の変換に失敗しました（mermaid-cli未導入の可能性）。`);
  }
}

if (failed > 0) {
  console.error(`\n⚠️ ${failed}件の変換に失敗しました。既存のSVGがあればビルドは継続可能です。`);
  process.exit(1);
}
console.log(`✅ ${files.length}件のSVGを生成しました。`);
