#!/usr/bin/env node
/**
 * 業務台帳への追記ツール（CLAUDE.md v4ルール / ADR-0001）。
 * 使い方: node ops/logctl.mjs "作業サマリ・決定事項・未完了タスク"
 * 形式: ops/worklog/YYYY-MM.md に「## YYYY-MM-DD」見出し＋「- HH:MM メッセージ」で追記
 * 注: 2026-07-08にフォーマット互換で再実装（初版はADR-0001セットアップ時に作成）
 */
import { appendFileSync, existsSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";

const msg = process.argv.slice(2).join(" ").trim();
if (!msg) { console.error('使い方: node ops/logctl.mjs "サマリ"'); process.exit(1); }

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const ym = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
const ymd = `${ym}-${pad(now.getDate())}`;
const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

mkdirSync("ops/worklog", { recursive: true });
const file = `ops/worklog/${ym}.md`;
if (!existsSync(file)) writeFileSync(file, `# 業務台帳 ${ym}\n\n`);
const body = readFileSync(file, "utf8");
let out = "";
if (!body.includes(`## ${ymd}`)) out += `## ${ymd}\n`;
out += `- ${hm} ${msg}\n`;
appendFileSync(file, out);
console.log(`✔ ${file} に追記: - ${hm} ${msg.slice(0, 60)}`);
