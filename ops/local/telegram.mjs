/**
 * Telegram承認運用の共通ヘルパー（依存ゼロ）。
 * 設定は ops/local/.env の TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID（gitignore済・コンプラ: 秘匿値はリポジトリに置かない）
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));

export function loadEnv() {
  const p = join(HERE, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

export function tgConfigured() {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

async function api(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method}: ${JSON.stringify(data).slice(0, 200)}`);
  return data.result;
}

export const sendMessage = (text, extra = {}) =>
  api("sendMessage", { chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });

export const getUpdates = (offset) => api("getUpdates", { offset, timeout: 0, allowed_updates: ["callback_query", "message"] });

export const answerCallback = (id, text) => api("answerCallbackQuery", { callback_query_id: id, text });

/** callback_dataは64byte制限のため、ブランチ名はハッシュIDで往復させる */
export const branchId = (branch) => createHash("sha1").update(branch).digest("hex").slice(0, 10);
