#!/usr/bin/env node
/**
 * Telegram承認ポーラー（EVO-X1のTask Schedulerが15分毎に実行）。
 * ボタン押下を検出して: 承認→reviewed:true化→main merge→push（VPSはcronで自動pull&deploy）
 * コンプラ: reviewed:true化の判断は必ずMasaruのボタン操作（人間承認ゲートの維持・ADR-0001準拠）。
 * 承認者検証: TELEGRAM_CHAT_ID と一致するチャットからの操作のみ受理。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, tgConfigured, sendMessage, getUpdates, answerCallback, branchId } from "./telegram.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OFFSET_FILE = join(HERE, ".tg_offset");
const QUEUE_FILE = join(HERE, "review_queue.md");
const today = new Date().toISOString().slice(0, 10);

loadEnv();
if (!tgConfigured()) process.exit(0);

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
// Windowsではnpm(.cmd)をexecFileできないため、validateはnode直叩き
const validate = () => execFileSync("node", ["ops/validate_content.mjs"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
// answerCallbackは押下から時間が経つと期限切れ400になる（15分ポーリングでは常態）→失敗は無視
const answerQuiet = (id, text) => answerCallback(id, text).catch(() => {});

/** リモートの draft/* ブランチをIDで解決（callback_dataの64byte制限対策） */
function resolveBranch(id) {
  const out = git("ls-remote", "--heads", "origin", "draft/*");
  for (const line of out.split("\n").filter(Boolean)) {
    const branch = line.split("\t")[1].replace("refs/heads/", "");
    if (branchId(branch) === id) return branch;
  }
  return null;
}

function removeFromQueue(branch) {
  if (!existsSync(QUEUE_FILE)) return;
  const kept = readFileSync(QUEUE_FILE, "utf8").split("\n").filter((l) => !l.includes(branch)).join("\n");
  writeFileSync(QUEUE_FILE, kept);
}

async function approve(branch) {
  if (git("status", "--porcelain")) throw new Error("作業ツリーが汚れているため中断（手動確認要）");
  git("fetch", "-q", "origin");
  git("checkout", "-q", "main");
  git("pull", "-q", "--ff-only");
  const files = git("diff", "--name-only", `main...origin/${branch}`, "--", "src/content").split("\n").filter(Boolean);
  if (files.length !== 1) throw new Error(`対象記事を特定できません（${files.length}件）`);
  const file = files[0];
  // ファクトチェックは生成パイプライン側で実施済み（final_audit.mjs・Masaru指示2026-07-08）。承認＝即公開
  await sendMessage("✅ 承認を確認しました。公開処理を開始します。");
  git("merge", "--no-ff", "-q", `origin/${branch}`, "-m", `publish: ${file}（Telegram承認・生成時ファクトチェック済）`);
  // 人間承認の記録として reviewed:true 化（承認ボタン押下がMasaruの承認行為）
  const p = join(ROOT, file);
  const flipped = readFileSync(p, "utf8").replace("reviewed: false", `reviewed: true\nreviewedAt: ${today}`);
  writeFileSync(p, flipped);
  validate(); // 公開前の最終ゲート。失敗時はcatch側でロールバック
  git("add", file);
  git("commit", "-q", "-m", `reviewed:true化（Telegram承認 ${today}）`);
  git("push", "-q");
  git("push", "-q", "origin", "--delete", branch);
  removeFromQueue(branch);
  const m = file.match(/^src\/content\/(\w+)\/(.+)\.md$/);
  const url = m ? `https://toushi-manabiya.jp/${m[1]}/${m[2]}/` : "https://toushi-manabiya.jp/";
  return `✅ 公開処理が完了しました。約10分以内に本番へ反映されます:\n${url}`;
}

function rollback() {
  try { git("merge", "--abort"); } catch {}
  try { git("checkout", "-q", "main"); git("reset", "--hard", "-q", "origin/main"); } catch {}
}

async function reject(branch) {
  removeFromQueue(branch);
  return `❌ 却下を確認しました。ブランチ ${branch} は残してあります（削除や修正指示はClaude Codeへ）。`;
}

// ---------- main ----------
let offset = 0;
try { offset = parseInt(readFileSync(OFFSET_FILE, "utf8"), 10) || 0; } catch {}
const updates = await getUpdates(offset + 1);
for (const u of updates) {
  offset = u.update_id;
  writeFileSync(OFFSET_FILE, String(offset));
  const cq = u.callback_query;
  if (!cq) continue;
  if (String(cq.message?.chat?.id) !== String(process.env.TELEGRAM_CHAT_ID)) continue; // 承認者検証
  const [act, id] = (cq.data || "").split(":");
  const branch = resolveBranch(id);
  try {
    if (!branch) { await answerQuiet(cq.id, "対象ブランチが見つかりません（処理済み？）"); continue; }
    await answerQuiet(cq.id, act === "a" ? "承認を確認" : "却下を確認");
    if (act === "r") await sendMessage("❌ 却下を確認しました。");
    const msg = act === "a" ? await approve(branch) : await reject(branch);
    await sendMessage(msg);
  } catch (e) {
    rollback();
    await answerQuiet(cq.id, "処理に失敗しました");
    await sendMessage(`⚠️ 処理失敗（安全側でロールバック済み）: ${String(e.message).slice(0, 300)}\nClaude Codeで確認してください。`);
  }
}
