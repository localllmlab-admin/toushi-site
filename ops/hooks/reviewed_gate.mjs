#!/usr/bin/env node
// PreToolUse(Edit|Write) hook: src/content 配下で reviewed が true へ「遷移」する編集を検出し、
// 人間の確認プロンプト(ask)を強制する。昇格はMasaru承認後のみ(CLAUDE.md v4ルール)。
// 編集適用後のファイル全文で判定するため、値だけ差し替える最小差分編集もすり抜けない。
import { readFileSync, existsSync } from "node:fs";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }
  const ti = input?.tool_input ?? {};
  const fp = String(ti.file_path ?? "");
  if (!/src[\\/]content[\\/]/.test(fp)) return;

  const RE = /reviewed:\s*true/i;
  let before = "";
  try {
    if (existsSync(fp)) before = readFileSync(fp, "utf8");
  } catch {
    // 読めない場合は下のフォールバック(書き込み内容のみ)で判定
  }

  let after = null;
  if (typeof ti.content === "string") {
    after = ti.content; // Write: 全文置換
  } else if (typeof ti.old_string === "string" && typeof ti.new_string === "string") {
    after = ti.replace_all
      ? before.split(ti.old_string).join(ti.new_string)
      : before.replace(ti.old_string, ti.new_string); // Edit: 適用結果を再現
  }

  const promoted =
    after == null
      ? RE.test(String(ti.new_string ?? "")) // 判定不能時は安全側フォールバック
      : RE.test(after) && !RE.test(before);

  if (promoted) {
    // process.exit()はパイプ時にstdoutを切断するため、自然終了に任せる
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason:
            "reviewed: true への昇格を検出。Masaruのレビュー承認済みの場合のみ許可してください。",
        },
      }) + "\n"
    );
  }
});
