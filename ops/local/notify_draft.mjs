#!/usr/bin/env node
/**
 * 夜間ドラフト完成をTelegramへ通知（承認/却下ボタン付き）。
 * 使い方: node ops/local/notify_draft.mjs <branch> <reviewUrl> <outPath>
 * トークン未設定なら黙ってスキップ（従来運用へフォールバック）。
 */
import { readFileSync } from "node:fs";
import { loadEnv, tgConfigured, sendMessage, branchId } from "./telegram.mjs";

loadEnv();
const [branch, reviewUrl, outPath] = process.argv.slice(2);
if (!tgConfigured()) { console.error("Telegram未設定: 通知スキップ"); process.exit(0); }
if (!branch || !reviewUrl) { console.error("引数不足"); process.exit(1); }

let title = branch;
try { title = readFileSync(outPath, "utf8").match(/^title:\s*"(.+)"/m)?.[1] ?? branch; } catch {}

// 直前の最終監査結果（final_audit.mjsが保存）を通知に添える
let auditNote = "";
try {
  const audit = JSON.parse(readFileSync(new URL("./.last_audit.json", import.meta.url), "utf8"));
  auditNote = "\n\n🔍 Hermes最終レビュー・監査・ファクトチェック: <b>PASS</b>";
  if (audit.issues?.length) auditNote += `\n軽微な指摘:\n${audit.issues.map((i) => `・${i}`).join("\n")}`;
} catch {}

const id = branchId(branch);
await sendMessage(
  `📝 <b>ファクトチェック済みのドラフト記事ができました</b>\n\n${title}\n\n差分レビュー:\n${reviewUrl}${auditNote}\n\n✅で即公開（約10分で本番反映）、❌で保留します。`,
  { reply_markup: { inline_keyboard: [[
    { text: "✅ 承認して公開", callback_data: `a:${id}` },
    { text: "❌ 却下", callback_data: `r:${id}` },
  ]] } },
);
console.error("Telegram通知送信済");
