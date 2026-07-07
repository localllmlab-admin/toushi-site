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

const id = branchId(branch);
await sendMessage(
  `📝 <b>新しいドラフト記事ができました</b>\n\n${title}\n\n差分レビュー:\n${reviewUrl}\n\n✅を押すと「承認を確認」の返信後、<b>最終レビュー・監査・ファクトチェックを必ず実行</b>し、合格した場合のみ公開します（不合格なら公開保留で報告します）。`,
  { reply_markup: { inline_keyboard: [[
    { text: "✅ 最終レビュー監査ファクトチェックしてから公開することを承認", callback_data: `a:${id}` },
  ], [
    { text: "❌ 却下", callback_data: `r:${id}` },
  ]] } },
);
console.error("Telegram通知送信済");
