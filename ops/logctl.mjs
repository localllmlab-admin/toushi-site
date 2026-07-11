#!/usr/bin/env node
/**
 * 業務台帳ツール（CLAUDE.md v4ルール / ADR-0001）。
 *
 * 追記:   node ops/logctl.mjs "作業サマリ・決定事項・未完了タスク"
 *         → ops/worklog/YYYY-MM.md に「## YYYY-MM-DD」見出し＋「- HH:MM メッセージ」で追記
 * export: node ops/logctl.mjs export --weekly [--week 2026-W28] [--format json]
 *         → 週次KPI JSONをstdoutへ（jitsuroku-pipeline向け・統合仕様書v2 §3.2）
 *         定量出典: marketing-director の GSC/GA4 自動取得データ（COO体制）。
 *         revenue/cost は構造化ソース未接続のため null（数値の創作・0埋めをしない）。
 * 注: 2026-07-08にフォーマット互換で再実装。2026-07-11 exportサブコマンド追加（Masaru承認）。
 *     サブコマンド未知の引数は従来通り「追記メッセージ」扱いになるため、
 *     機械呼び出しは必ず export を第一引数にすること。
 */
import { appendFileSync, existsSync, writeFileSync, readFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const pad = (n) => String(n).padStart(2, "0");

function appendWorklog() {
  const msg = process.argv.slice(2).join(" ").trim();
  if (!msg) { console.error('使い方: node ops/logctl.mjs "サマリ" | export --weekly'); process.exit(1); }
  const now = new Date();
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
}

// ─────────────────────────────────────────────────────────
// export --weekly: 週次KPI JSON（サイト別 PV / GSCクリック / 表示回数）
// ─────────────────────────────────────────────────────────

// GA4プロパティ名・GSCドメイン → jitsuroku site slug の対応表
const SITE_MAP = [
  { site: "ai-no-iroha",     domain: "ai-no-iroha.com",     ga4: "AIのいろは" },
  { site: "minaoshi-lab",    domain: "minaoshi-lab.com",    ga4: "見直しラボ" },
  { site: "sato-cospa",      domain: "sato-cospa.com",      ga4: "さとコスパ" },
  { site: "hanashibeta",     domain: "hanashibeta.com",     ga4: "話し下手Lab" },
  { site: "toushi-manabiya", domain: "toushi-manabiya.jp",  ga4: "投資の学び舎" },
];

function isoWeekOf(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day); // 木曜基準
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad(week)}`;
}

function weekRange(weekStr) {
  const [y, w] = weekStr.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1 + (w - 1) * 7);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    days.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
  }
  return days; // ["YYYY-MM-DD" x7] 月〜日
}

function runExport(args) {
  if (!args.includes("--weekly")) {
    console.error("使い方: node ops/logctl.mjs export --weekly [--week 2026-W28] [--format json]");
    process.exit(1);
  }
  const wi = args.indexOf("--week");
  const week = wi >= 0 ? args[wi + 1] : isoWeekOf(new Date());
  const days = weekRange(week);
  const daySet = new Set(days);
  const dayCompact = new Set(days.map((d) => d.replaceAll("-", ""))); // GA4は "20260707" 形式

  const dataRoot = process.env.MD_DATA_DIR || "C:/Users/masaru/marketing-director/data";
  const dateDirs = readdirSync(dataRoot).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if (!dateDirs.length) { console.error(`KPIデータなし: ${dataRoot}`); process.exit(1); }
  const latest = dateDirs[dateDirs.length - 1];
  const ga4 = JSON.parse(readFileSync(join(dataRoot, latest, "ga4.json"), "utf8"));
  const gsc = JSON.parse(readFileSync(join(dataRoot, latest, "gsc.json"), "utf8"));

  const sites = SITE_MAP.map(({ site, domain, ga4: ga4Name }) => {
    const ga4Rows = ga4.properties?.[ga4Name]?.byDate;
    const pv = Array.isArray(ga4Rows)
      ? ga4Rows.filter((r) => dayCompact.has(r.date)).reduce((s, r) => s + (r.pageViews || 0), 0)
      : null; // GA4未接続サイトは null（0と区別する）
    const gscRows = gsc.sites?.[domain]?.byDate;
    const rows = Array.isArray(gscRows) ? gscRows.filter((r) => daySet.has(r.keys?.[0])) : null;
    return {
      site,
      domain,
      pv,
      gsc_clicks: rows ? rows.reduce((s, r) => s + (r.clicks || 0), 0) : null,
      gsc_impressions: rows ? rows.reduce((s, r) => s + (r.impressions || 0), 0) : null,
      revenue_yen: null, // 構造化ソース未接続（ASP CSV連携まで null 固定・0埋め禁止）
      cost_yen: null,
    };
  });

  const sum = (key) => sites.reduce((s, r) => (r[key] == null ? s : s + r[key]), 0);
  const out = {
    week,
    range: { start: days[0], end: days[6] },
    source: { dir: join(dataRoot, latest), ga4_end: ga4.endDate, gsc_end: gsc.endDate },
    sites,
    totals: { pv: sum("pv"), gsc_clicks: sum("gsc_clicks"), gsc_impressions: sum("gsc_impressions") },
  };
  console.log(JSON.stringify(out, null, 2));
}

switch (process.argv[2]) {
  case "export":
    runExport(process.argv.slice(3));
    break;
  default:
    appendWorklog();
}
