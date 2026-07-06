#!/usr/bin/env node
// PostToolUse(Edit|Write) hook: src/content の .md/.mdx 編集後に jp_style_lint を自動実行。
// 70点未満(v3品質ゲート基準)は exit 2 で指摘をClaudeへ差し戻す。
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const fp = String(
    input?.tool_input?.file_path ?? input?.tool_response?.filePath ?? ""
  );
  if (!/src[\\/]content[\\/].*\.(md|mdx)$/.test(fp)) process.exit(0);

  const lintPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "jp_style_lint.mjs"
  );
  const r = spawnSync(process.execPath, [lintPath, fp, "--json"], {
    encoding: "utf8",
    timeout: 20000,
  });
  let result;
  try {
    result = JSON.parse(r.stdout);
  } catch {
    process.exit(0); // リンター自体の異常はブロックしない
  }
  if (!result || typeof result !== "object") process.exit(0); // spawn失敗(stdout=null)等もフェイルオープン
  // process.exit()はパイプ時に出力を切断するため exitCode + 自然終了を使う
  if (typeof result.score === "number" && result.score < 70) {
    process.stderr.write(
      `[jp_style_lint] ${result.score}点 (<70 品質ゲート不合格)。指摘:\n` +
        JSON.stringify(result.issues ?? result, null, 1).slice(0, 1500) + "\n"
    );
    process.exitCode = 2;
    return;
  }
  process.stdout.write(`[jp_style_lint] ${result.score}点 OK\n`);
});
