#!/usr/bin/env node
/**
 * 最終レビュー・監査・ファクトチェック（必須工程・Masaru指示2026-07-08）。
 * 生成パイプラインのAPI磨き後に run_nightly.sh から実行する。
 * - 監査エンジン = VPSのHermes agent（/usr/local/bin/toushi-hermes-audit.sh・Masaru指示でClaudeヘッドレスから変更）
 * - PASS: 結果を .last_audit.json に保存して exit 0（通知文へ引き継ぐ）
 * - FAIL: Telegramへ保留通知を送り exit 1（公開経路に乗せない）
 * 使い方: node ops/local/final_audit.mjs <記事ファイルパス>
 */
import { readFileSync, writeFileSync, copyFileSync, chmodSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { loadEnv, tgConfigured, sendMessage } from "./telegram.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULT_FILE = join(HERE, ".last_audit.json");
loadEnv();

const file = process.argv[2];
if (!file) { console.error("使い方: node final_audit.mjs <記事パス>"); process.exit(1); }
const content = readFileSync(file, "utf8");

/** VPSのHermes監査ラッパーをSSHで呼ぶ（鍵・パスフレーズは ops/local/.env から） */
function runHermesAudit(article) {
  const { VPS_HOST, VPS_SSH_KEY, VPS_KEY_PASSPHRASE } = process.env;
  if (!VPS_HOST || !VPS_SSH_KEY) throw new Error("VPS_HOST/VPS_SSH_KEY が未設定（ops/local/.env）");
  const key = join(tmpdir(), "toushi_audit_key.pem");
  copyFileSync(VPS_SSH_KEY.replace(/^\/c\//, "C:/"), key);
  chmodSync(key, 0o600);
  const askpass = join(tmpdir(), "toushi_askpass.sh");
  writeFileSync(askpass, `#!/bin/sh\necho ${VPS_KEY_PASSPHRASE || ""}\n`);
  chmodSync(askpass, 0o700);
  const cmd = `DISPLAY=:0 SSH_ASKPASS='${askpass}' SSH_ASKPASS_REQUIRE=force ssh -i '${key}' -o StrictHostKeyChecking=accept-new root@${VPS_HOST} /usr/local/bin/toushi-hermes-audit.sh`;
  return execFileSync("bash", ["-c", cmd], { input: article, encoding: "utf8", timeout: 900000, maxBuffer: 16 * 1024 * 1024 });
}

let result;
try {
  const out = runHermesAudit(content);
  const m = out.match(/\{\s*"verdict"[\s\S]*?\}/g);
  result = m ? JSON.parse(m[m.length - 1]) : { verdict: "FAIL", issues: ["Hermes監査出力を解釈できませんでした"] };
} catch (e) {
  result = { verdict: "FAIL", issues: [`監査実行エラー: ${String(e.message).slice(0, 150)}`] };
}

writeFileSync(RESULT_FILE, JSON.stringify(result));
console.error(`Hermes監査: ${result.verdict}${result.issues?.length ? `（指摘${result.issues.length}件）` : ""}`);

if (result.verdict !== "PASS") {
  const issues = (result.issues || []).map((i) => `・${i}`).join("\n");
  if (tgConfigured()) {
    await sendMessage(`⛔ <b>本日の生成記事はHermes最終監査・ファクトチェックで不合格でした</b>（公開経路に乗せず保留）\n\n${issues}\n\n記事は ops/local/rejected/ に退避します。対応はClaude Codeへ。`).catch(() => {});
  }
  process.exit(1);
}
console.log(JSON.stringify(result));
