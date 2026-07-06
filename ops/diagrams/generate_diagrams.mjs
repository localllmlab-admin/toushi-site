#!/usr/bin/env node
/**
 * 記事用SVG図解ジェネレーター。
 * - 出力: public/diagrams/*.svg（ビルド不要の静的アセット・べき等）
 * - 配色はデザイントークン準拠: 陽線/上昇=朱 #c73e2e、陰線/下落=青 #0075c2、
 *   注釈=#57606e、罫線=#dde3ec、強調水準=#a3690f
 * - すべて模式図。実在の銘柄・価格データを使わない（コンプラ制約）。
 * 使い方: node ops/diagrams/generate_diagrams.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/diagrams";
mkdirSync(OUT, { recursive: true });

const UP = "#c73e2e";      // 陽線・上昇
const DN = "#0075c2";      // 陰線・下落
const INK = "#26313f";     // 主線
const SUB = "#57606e";     // 注釈
const GRID = "#dde3ec";    // 罫線
const LV = "#a3690f";      // 水準線（琥珀）
const FONT = 'font-family="Hiragino Sans, Noto Sans JP, Meiryo, sans-serif"';

const txt = (x, y, s, { size = 13, fill = SUB, anchor = "start", bold = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${bold ? 'font-weight="700"' : ""} ${FONT}>${s}</text>`;

const line = (x1, y1, x2, y2, { color = INK, w = 2, dash = "" } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;

const poly = (pts, { color = INK, w = 2.5, dash = "" } = {}) =>
  `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`;

// 矢印（手描きの三角ヘッド）
function arrow(x1, y1, x2, y2, { color = UP, w = 2.5 } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 9;
  const p1 = [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)];
  const p2 = [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)];
  return line(x1, y1, x2, y2, { color, w }) +
    `<polygon points="${x2},${y2} ${p1.join(",")} ${p2.join(",")}" fill="${color}"/>`;
}

// ローソク足。yはすべて座標（小さいほど高値）。open/close の大小で陽陰を自動判定
function candle(cx, yH, yO, yC, yL, { w = 16 } = {}) {
  const up = yC < yO;
  const color = up ? UP : DN;
  const top = Math.min(yO, yC);
  const hgt = Math.max(Math.abs(yO - yC), 2);
  return line(cx, yH, cx, yL, { color, w: 2 }) +
    `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="${hgt}" rx="1.5" fill="${up ? UP : DN}"/>`;
}

const grid = (W, H, n = 4) =>
  Array.from({ length: n }, (_, i) => line(0, ((i + 1) * H) / (n + 1), W, ((i + 1) * H) / (n + 1), { color: GRID, w: 1 })).join("");

function save(name, W, H, inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img">
<rect width="${W}" height="${H}" fill="#ffffff"/>
${grid(W, H)}
${inner}
</svg>`;
  writeFileSync(`${OUT}/${name}.svg`, svg);
  console.log(`✔ ${name}.svg`);
}

/* ============ 1. トレンドフォロー ============ */
{
  const pts = [[30, 270], [90, 210], [140, 240], [200, 165], [250, 200], [320, 120], [370, 155], [440, 80], [490, 110], [560, 45]];
  let g = poly(pts, { color: INK });
  // 安値切り上げ○
  [[140, 240], [250, 200], [370, 155], [490, 110]].forEach(([x, y]) => {
    g += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="${UP}" stroke-width="2"/>`;
  });
  g += txt(120, 292, "安値の切り上げ = 上昇トレンドの定義", { fill: UP, bold: true });
  g += line(200, 165, 330, 165, { color: LV, w: 1.5, dash: "5 4" });
  g += txt(205, 156, "直近高値", { fill: LV });
  g += arrow(300, 190, 328, 130, { color: UP });
  g += txt(336, 138, "高値更新で追随（順張り）", { fill: UP, bold: true });
  save("trend-following", 640, 310, g);
}

/* ============ 2. ブレイクアウト（成功とダマシ） ============ */
{
  let g = "";
  // 左: 成功
  g += line(30, 110, 260, 110, { color: LV, w: 2, dash: "6 4" });
  g += txt(32, 100, "節目（レンジ上限）", { fill: LV });
  g += poly([[30, 200], [70, 130], [105, 185], [140, 125], [175, 190], [205, 115], [230, 108], [250, 70], [285, 40]], { color: INK });
  g += arrow(250, 95, 285, 48, { color: UP });
  g += txt(60, 265, "成功例：抜けた方向へ加速", { bold: true, fill: UP });
  // 右: ダマシ
  const dx = 350;
  g += line(dx, 110, dx + 230, 110, { color: LV, w: 2, dash: "6 4" });
  g += poly([[dx, 195], [dx + 40, 135], [dx + 75, 185], [dx + 110, 125], [dx + 140, 95], [dx + 170, 150], [dx + 200, 230], [dx + 230, 255]], { color: INK });
  g += `<circle cx="${dx + 140}" cy="95" r="8" fill="none" stroke="${DN}" stroke-width="2"/>`;
  g += arrow(dx + 160, 130, dx + 195, 220, { color: DN });
  g += txt(dx + 40, 265, "ダマシ：抜けた後に失速", { bold: true, fill: DN });
  g += line(320, 20, 320, 290, { color: GRID, w: 1 });
  save("breakout", 640, 310, g);
}

/* ============ 3. 押し目買い ============ */
{
  // 上昇トレンド＋移動平均線＋押し目
  const price = [[30, 260], [80, 200], [120, 225], [170, 150], [210, 180], [240, 195], [270, 205], [310, 130], [360, 160], [390, 175], [430, 90], [480, 120], [530, 135], [590, 55]];
  const ma = [[30, 285], [110, 250], [190, 215], [270, 190], [350, 165], [430, 140], [510, 115], [590, 90]];
  let g = poly(ma, { color: LV, w: 2.5 });
  g += poly(price, { color: INK });
  g += txt(540, 100, "移動平均線", { fill: LV });
  // 押し目
  [[270, 205], [390, 175], [530, 135]].forEach(([x, y]) => {
    g += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${UP}" stroke-width="2"/>`;
  });
  g += arrow(270, 250, 270, 218, { color: UP });
  g += txt(240, 275, "基準線への押しを待って買う", { fill: UP, bold: true });
  g += line(170, 232, 320, 232, { color: DN, w: 1.5, dash: "4 3" });
  g += txt(175, 248, "直近安値割れ＝撤退基準", { fill: DN, size: 12 });
  save("pullback", 640, 310, g);
}

/* ============ 4. 逆張り（危険性） ============ */
{
  // 下落継続の中のナンピン
  const pts = [[30, 40], [90, 90], [130, 70], [190, 140], [230, 120], [290, 190], [330, 170], [390, 235], [430, 215], [500, 275]];
  let g = poly(pts, { color: INK });
  [[130, 70], [230, 120], [330, 170], [430, 215]].forEach(([x, y], i) => {
    g += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${DN}" stroke-width="2"/>`;
    g += txt(x + 10, y - 8, `買い${i + 1}`, { fill: DN, size: 12 });
  });
  g += txt(300, 60, "「そろそろ反転するはず」の買い下がりは", { fill: DN, bold: true });
  g += txt(300, 80, "トレンド継続で損失が拡大し続ける", { fill: DN, bold: true });
  g += line(30, 250, 610, 250, { color: DN, w: 1.5, dash: "5 4" });
  g += txt(455, 268, "撤退基準がなければここでも止まれない", { fill: SUB, size: 12 });
  save("contrarian", 640, 310, g);
}

/* ============ 5. テクニカル vs ファンダメンタル ============ */
{
  let g = "";
  // 左箱: テクニカル
  g += `<rect x="30" y="40" width="270" height="220" rx="8" fill="#f7fafd" stroke="${GRID}"/>`;
  g += txt(165, 70, "テクニカル分析", { anchor: "middle", bold: true, fill: INK, size: 15 });
  g += poly([[60, 210], [100, 160], [130, 185], [170, 120], [200, 145], [240, 100], [270, 115]], { color: DN });
  g += txt(165, 240, "値動き（チャート）から考える", { anchor: "middle", size: 12 });
  // 右箱: ファンダ
  g += `<rect x="340" y="40" width="270" height="220" rx="8" fill="#f7fafd" stroke="${GRID}"/>`;
  g += txt(475, 70, "ファンダメンタル分析", { anchor: "middle", bold: true, fill: INK, size: 15 });
  ["業績・財務", "金利・景気", "制度・政策"].forEach((s, i) => {
    g += `<rect x="380" y="${95 + i * 42}" width="190" height="30" rx="4" fill="#ffffff" stroke="${GRID}"/>`;
    g += txt(475, 115 + i * 42, s, { anchor: "middle", fill: INK, size: 13 });
  });
  g += txt(475, 240, "価値（本来の値打ち）から考える", { anchor: "middle", size: 12 });
  g += txt(320, 290, "「何を買うか」はファンダ、「いつ買うか」はテクニカル、という整理が一般的", { anchor: "middle", fill: SUB, size: 12.5 });
  save("tech-vs-fund", 640, 310, g);
}

/* ============ 6. ローソク足の構造 ============ */
{
  let g = "";
  // 陽線（大きく）
  g += candle(180, 50, 210, 90, 260, { w: 44 });
  g += txt(180, 292, "陽線（終値＞始値）", { anchor: "middle", fill: UP, bold: true });
  // ラベル
  g += line(180, 50, 250, 50, { color: GRID, w: 1 }); g += txt(256, 54, "高値", { fill: INK });
  g += line(202, 90, 265, 70, { color: GRID, w: 1 }); g += txt(270, 72, "実体の上端＝終値", { fill: INK });
  g += line(202, 210, 265, 218, { color: GRID, w: 1 }); g += txt(270, 222, "実体の下端＝始値", { fill: INK });
  g += line(180, 260, 250, 260, { color: GRID, w: 1 }); g += txt(256, 264, "安値", { fill: INK });
  g += txt(120, 72, "上ヒゲ", { anchor: "end" });
  g += txt(120, 245, "下ヒゲ", { anchor: "end" });
  g += txt(120, 150, "実体", { anchor: "end", fill: INK, bold: true });
  // 陰線
  g += candle(480, 60, 100, 215, 265, { w: 44 });
  g += txt(480, 292, "陰線（終値＜始値）", { anchor: "middle", fill: DN, bold: true });
  g += line(502, 100, 560, 92, { color: GRID, w: 1 }); g += txt(565, 96, "始値", { fill: INK });
  g += line(502, 215, 560, 225, { color: GRID, w: 1 }); g += txt(565, 229, "終値", { fill: INK });
  save("candle-anatomy", 640, 310, g);
}

/* ============ 7. 移動平均線とクロス ============ */
{
  // 短期線と長期線のクロス
  const slow = [[30, 150], [110, 158], [190, 168], [270, 172], [350, 168], [430, 155], [510, 138], [610, 118]];
  const fast = [[30, 220], [110, 235], [190, 225], [270, 195], [350, 150], [430, 115], [510, 92], [610, 70]];
  let g = poly(slow, { color: LV, w: 2.5 });
  g += poly(fast, { color: DN, w: 2.5 });
  g += txt(545, 132, "長期線", { fill: LV, bold: true });
  g += txt(545, 62, "短期線", { fill: DN, bold: true });
  // クロス点（fast が slow を上抜く付近 x≈310）
  g += `<circle cx="312" cy="170" r="10" fill="none" stroke="${UP}" stroke-width="2.5"/>`;
  g += arrow(312, 245, 312, 186, { color: UP });
  g += txt(312, 268, "ゴールデンクロス（短期線が長期線を上抜け）", { anchor: "middle", fill: UP, bold: true });
  g += txt(320, 30, "※逆に短期線が長期線を下抜ける形がデッドクロス", { anchor: "middle", size: 12 });
  save("ma-cross", 640, 310, g);
}

/* ============ 8. 出来高と価格 ============ */
{
  let g = "";
  // 前半: 上昇+出来高増 / 後半: 上昇+出来高減
  const price = [[30, 180], [80, 150], [130, 165], [180, 120], [230, 135], [280, 90], [330, 105], [380, 80], [430, 92], [480, 70], [530, 82], [580, 62]];
  g += poly(price, { color: INK });
  // 出来高バー
  const vols = [
    [30, 34], [80, 44], [130, 40], [180, 58], [230, 52], [280, 72], // 増加
    [330, 60], [380, 48], [430, 40], [480, 32], [530, 26], [580, 20], // 減少
  ];
  vols.forEach(([x, h], i) => {
    g += `<rect x="${x - 10}" y="${272 - h}" width="20" height="${h}" fill="${i < 6 ? UP : "#c9ced8"}"/>`;
  });
  g += line(320, 200, 320, 285, { color: GRID, w: 1 });
  g += txt(170, 297, "出来高を伴う上昇＝裏付けあり", { anchor: "middle", fill: UP, bold: true, size: 12.5 });
  g += txt(465, 297, "出来高が細る上昇＝勢いの衰えを疑う", { anchor: "middle", fill: SUB, bold: true, size: 12.5 });
  g += txt(40, 40, "価格", { fill: INK, size: 12 });
  g += txt(40, 225, "出来高", { fill: INK, size: 12 });
  save("volume-price", 640, 310, g);
}

/* ============ 9. 三尊（ヘッドアンドショルダー） ============ */
{
  const pts = [[30, 265], [80, 190], [125, 150], [170, 205], [225, 95], [285, 205], [330, 160], [375, 210], [420, 265], [470, 290]];
  let g = poly(pts, { color: INK });
  g += line(150, 207, 400, 207, { color: LV, w: 2, dash: "6 4" });
  g += txt(125, 133, "左肩", { anchor: "middle", fill: INK, bold: true });
  g += txt(225, 78, "頭", { anchor: "middle", fill: INK, bold: true });
  g += txt(330, 143, "右肩", { anchor: "middle", fill: INK, bold: true });
  g += txt(405, 198, "ネックライン", { fill: LV, bold: true, size: 12.5 });
  g += `<circle cx="398" cy="240" r="8" fill="none" stroke="${DN}" stroke-width="2"/>`;
  g += txt(415, 245, "割れて完成", { fill: DN, bold: true, size: 12.5 });
  // 目標値投影
  g += line(225, 95, 225, 207, { color: SUB, w: 1.5, dash: "3 3" });
  g += arrow(440, 207, 440, 290, { color: SUB, w: 1.5 });
  g += txt(452, 262, "頭〜ネックラインの値幅を下に投影＝目安", { size: 12 });
  save("head-shoulders", 640, 310, g);
}

/* ============ 10. 三角保ち合い3タイプ ============ */
{
  let g = "";
  const panel = (x0, label, upper, lower, zig) => {
    let s = poly(zig, { color: INK, w: 2 });
    s += poly(upper, { color: LV, w: 2, dash: "5 3" });
    s += poly(lower, { color: LV, w: 2, dash: "5 3" });
    s += txt(x0 + 95, 275, label, { anchor: "middle", bold: true, fill: INK });
    return s;
  };
  // 対称
  g += panel(30, "対称三角形",
    [[30, 80], [200, 150]], [[30, 240], [200, 165]],
    [[30, 90], [65, 225], [100, 110], [135, 205], [165, 135], [195, 172]]);
  // 上昇
  g += panel(240, "上昇三角形（上値一定）",
    [[240, 95], [410, 95]], [[240, 245], [410, 120]],
    [[240, 230], [275, 100], [310, 195], [345, 100], [380, 140], [405, 100]]);
  // 下降
  g += panel(450, "下降三角形（下値一定）",
    [[450, 75], [615, 195]], [[450, 235], [615, 235]],
    [[450, 90], [485, 228], [520, 130], [555, 228], [585, 180], [610, 228]]);
  g += line(225, 40, 225, 260, { color: GRID, w: 1 });
  g += line(435, 40, 435, 260, { color: GRID, w: 1 });
  g += txt(320, 300, "幅が狭まりながら収束し、放れた方向についていくのが教科書的な扱い", { anchor: "middle", size: 12.5 });
  save("triangles", 640, 320, g);
}

/* ============ 11. フラッグとペナント ============ */
{
  let g = "";
  // フラッグ
  g += poly([[40, 280], [70, 180], [95, 90]], { color: UP, w: 3 }); // 旗竿
  g += poly([[95, 90], [125, 110], [150, 100], [180, 122], [205, 112], [230, 132]], { color: INK, w: 2 });
  g += poly([[95, 85], [235, 118]], { color: LV, w: 1.5, dash: "4 3" });
  g += poly([[112, 122], [242, 148]], { color: LV, w: 1.5, dash: "4 3" });
  g += arrow(230, 120, 265, 55, { color: UP });
  g += txt(150, 292, "フラッグ（平行四辺形の小休止）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += txt(70, 120, "旗竿", { fill: UP, bold: true, size: 12.5 });
  // ペナント
  const dx = 340;
  g += poly([[dx + 20, 280], [dx + 50, 175], [dx + 75, 85]], { color: UP, w: 3 });
  g += poly([[dx + 75, 85], [dx + 105, 125], [dx + 130, 100], [dx + 155, 120], [dx + 175, 108]], { color: INK, w: 2 });
  g += poly([[dx + 75, 80], [dx + 185, 106]], { color: LV, w: 1.5, dash: "4 3" });
  g += poly([[dx + 75, 140], [dx + 185, 112]], { color: LV, w: 1.5, dash: "4 3" });
  g += arrow(dx + 180, 105, dx + 215, 45, { color: UP });
  g += txt(dx + 130, 292, "ペナント（小さな三角形）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += line(320, 40, 320, 270, { color: GRID, w: 1 });
  save("flag-pennant", 640, 310, g);
}

/* ============ 12. サポートとレジスタンス ============ */
{
  let g = line(30, 210, 350, 210, { color: UP, w: 2, dash: "6 4" });
  g += line(30, 110, 610, 110, { color: DN, w: 2, dash: "6 4" });
  const pts = [[30, 180], [75, 208], [120, 140], [165, 206], [210, 120], [255, 205], [300, 115], [345, 108], [385, 70], [425, 105], [470, 60], [520, 95], [575, 40]];
  g += poly(pts, { color: INK });
  [[75, 208], [165, 206], [255, 205]].forEach(([x, y]) => {
    g += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${UP}" stroke-width="2"/>`;
  });
  g += txt(40, 235, "サポート（何度も下げ止まる）", { fill: UP, bold: true, size: 12.5 });
  g += txt(40, 96, "レジスタンス（何度も上値を抑える）", { fill: DN, bold: true, size: 12.5 });
  g += `<circle cx="345" cy="108" r="8" fill="none" stroke="${LV}" stroke-width="2"/>`;
  g += txt(355, 135, "上抜け", { fill: LV, bold: true, size: 12.5 });
  g += `<circle cx="425" cy="105" r="8" fill="none" stroke="${LV}" stroke-width="2"/>`;
  g += txt(430, 145, "リターンムーブ：抜けた水準が", { size: 12 });
  g += txt(430, 162, "今度はサポートに（役割転換）", { size: 12 });
  save("support-resistance", 640, 310, g);
}

/* ============ 13. 包み足・はらみ足 ============ */
{
  let g = "";
  // 陽の包み足（下落後）
  g += poly([[40, 60], [70, 95], [95, 120]], { color: SUB, w: 1.5, dash: "3 3" });
  g += candle(120, 105, 115, 165, 175, { w: 22 }); // 陰線
  g += candle(160, 85, 178, 95, 190, { w: 22 });   // 大陽線が包む
  g += `<rect x="140" y="88" width="42" height="97" rx="4" fill="none" stroke="${UP}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  g += txt(140, 230, "陽の包み足", { anchor: "middle", bold: true, fill: UP });
  g += txt(140, 252, "前の実体を丸ごと包む", { anchor: "middle", size: 12 });
  g += txt(140, 270, "安値圏なら底打ち候補", { anchor: "middle", size: 12 });
  // 陰の包み足（上昇後）
  g += poly([[260, 190], [290, 150], [315, 120]], { color: SUB, w: 1.5, dash: "3 3" });
  g += candle(340, 95, 155, 105, 165, { w: 22 });  // 陽線
  g += candle(380, 75, 85, 180, 195, { w: 22 });   // 大陰線が包む
  g += txt(360, 230, "陰の包み足", { anchor: "middle", bold: true, fill: DN });
  g += txt(360, 252, "高値圏なら天井候補", { anchor: "middle", size: 12 });
  // はらみ足
  g += candle(510, 70, 80, 195, 210, { w: 26 });   // 大陰線
  g += candle(550, 120, 155, 130, 170, { w: 18 }); // 小陽線（内側）
  g += `<rect x="536" y="112" width="28" height="66" rx="4" fill="none" stroke="${LV}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  g += txt(530, 230, "はらみ足", { anchor: "middle", bold: true, fill: LV });
  g += txt(530, 252, "前の実体の内側に収まる", { anchor: "middle", size: 12 });
  g += txt(530, 270, "勢いの一服・迷い", { anchor: "middle", size: 12 });
  g += line(240, 40, 240, 280, { color: GRID, w: 1 });
  g += line(460, 40, 460, 280, { color: GRID, w: 1 });
  save("engulfing-harami", 640, 300, g);
}

/* ============ 14. カラカサ・トンカチ ============ */
{
  let g = "";
  // 安値圏のカラカサ
  g += poly([[40, 60], [75, 100], [110, 140]], { color: SUB, w: 1.5, dash: "3 3" });
  g += candle(145, 130, 130, 145, 210, { w: 20 }); // 長い下ヒゲ・小さい実体（カラカサ）
  g += txt(125, 250, "安値圏のカラカサ", { anchor: "middle", bold: true, fill: UP });
  g += txt(125, 270, "売りが出尽くし買い戻された形", { anchor: "middle", size: 12 });
  g += txt(125, 288, "→ 底打ち候補（ハンマー）", { anchor: "middle", size: 12 });
  // 高値圏のトンカチ
  g += poly([[250, 200], [285, 160], [320, 120]], { color: SUB, w: 1.5, dash: "3 3" });
  g += candle(355, 60, 125, 140, 150, { w: 20 }); // 長い上ヒゲ（トンカチ）
  g += txt(335, 250, "高値圏のトンカチ", { anchor: "middle", bold: true, fill: DN });
  g += txt(335, 270, "上値で強く押し戻された形", { anchor: "middle", size: 12 });
  g += txt(335, 288, "→ 天井候補（シューティングスター）", { anchor: "middle", size: 12 });
  // 高値圏のカラカサ＝首吊り線
  g += poly([[460, 200], [495, 160], [530, 120]], { color: SUB, w: 1.5, dash: "3 3" });
  g += candle(565, 110, 110, 125, 190, { w: 20 });
  g += txt(545, 250, "高値圏のカラカサ＝首吊り線", { anchor: "middle", bold: true, fill: LV, size: 12.5 });
  g += txt(545, 270, "同じ形でも位置で解釈が変わり", { anchor: "middle", size: 12 });
  g += txt(545, 288, "警戒シグナルとされる", { anchor: "middle", size: 12 });
  g += line(230, 40, 230, 295, { color: GRID, w: 1 });
  g += line(445, 40, 445, 295, { color: GRID, w: 1 });
  save("hammer-shooting-star", 640, 310, g);
}

/* ============ 15. 明けの明星・宵の明星・三兵 ============ */
{
  let g = "";
  // 明けの明星
  g += candle(60, 60, 70, 160, 170, { w: 22 });    // 大陰線
  g += candle(105, 175, 185, 195, 205, { w: 16 }); // 下に窓を開けた小さい足
  g += candle(150, 75, 165, 85, 175, { w: 22 });   // 大陽線
  g += txt(105, 245, "明けの明星", { anchor: "middle", bold: true, fill: UP });
  g += txt(105, 265, "陰→小さな足→陽で底打ち候補", { anchor: "middle", size: 12 });
  // 宵の明星
  g += candle(280, 60, 150, 70, 160, { w: 22 });   // 大陽線
  g += candle(325, 35, 45, 55, 70, { w: 16 });     // 上に窓
  g += candle(370, 55, 65, 155, 165, { w: 22 });   // 大陰線
  g += txt(325, 245, "宵の明星", { anchor: "middle", bold: true, fill: DN });
  g += txt(325, 265, "陽→小さな足→陰で天井候補", { anchor: "middle", size: 12 });
  // 赤三兵
  g += candle(500, 130, 140, 185, 195, { w: 20 });
  g += candle(540, 95, 110, 150, 160, { w: 20 });
  g += candle(580, 60, 78, 115, 125, { w: 20 });
  g += txt(540, 245, "赤三兵", { anchor: "middle", bold: true, fill: UP });
  g += txt(540, 265, "陽線3本の連続＝勢いの継続", { anchor: "middle", size: 12 });
  g += line(225, 25, 225, 275, { color: GRID, w: 1 });
  g += line(445, 25, 445, 275, { color: GRID, w: 1 });
  save("morning-evening-star", 640, 290, g);
}

/* ============ 16. ダブルトップ／ダブルボトム（既存記事用） ============ */
{
  let g = "";
  // ダブルトップ
  const pts = [[30, 250], [75, 120], [120, 90], [165, 175], [215, 92], [260, 130], [300, 235], [330, 270]];
  g += poly(pts, { color: INK });
  g += line(140, 177, 320, 177, { color: LV, w: 2, dash: "6 4" });
  g += txt(120, 74, "山①", { anchor: "middle", fill: INK, bold: true });
  g += txt(215, 76, "山②", { anchor: "middle", fill: INK, bold: true });
  g += txt(325, 168, "ネックライン", { fill: LV, size: 12, anchor: "end" });
  g += `<circle cx="290" cy="212" r="8" fill="none" stroke="${DN}" stroke-width="2"/>`;
  g += txt(240, 292, "下抜けで完成＝反転の可能性", { anchor: "middle", fill: DN, bold: true, size: 12.5 });
  // ダブルボトム
  const dx = 360;
  const pts2 = [[dx, 60], [dx + 45, 190], [dx + 90, 220], [dx + 135, 140], [dx + 185, 218], [dx + 230, 175], [dx + 260, 80]];
  g += poly(pts2, { color: INK });
  g += line(dx + 110, 138, dx + 265, 138, { color: LV, w: 2, dash: "6 4" });
  g += txt(dx + 90, 245, "谷①", { anchor: "middle", fill: INK, bold: true });
  g += txt(dx + 185, 245, "谷②", { anchor: "middle", fill: INK, bold: true });
  g += `<circle cx="${dx + 243}" cy="120" r="8" fill="none" stroke="${UP}" stroke-width="2"/>`;
  g += txt(dx + 130, 292, "上抜けで完成（ダブルボトム）", { anchor: "middle", fill: UP, bold: true, size: 12.5 });
  g += line(345, 30, 345, 280, { color: GRID, w: 1 });
  save("double-top-bottom", 640, 310, g);
}

/* ============ 17. ドルコスト平均法 ============ */
{
  let g = "";
  const prices = [100, 140, 80, 120, 60, 100]; // 価格推移（模式値）
  const px = prices.map((p, i) => [60 + i * 100, 180 - (p - 60) * 1.1]);
  g += poly(px, { color: INK });
  prices.forEach((p, i) => {
    const units = Math.round((100 / p) * 10) / 10; // 定額1万円で買える口数
    const h = units * 38;
    g += `<rect x="${60 + i * 100 - 14}" y="${272 - h}" width="28" height="${h}" fill="${UP}" opacity="0.85"/>`;
    g += txt(60 + i * 100, 288, `${units}口`, { anchor: "middle", size: 11.5 });
    g += txt(60 + i * 100, px[i][1] - 10, `${p}`, { anchor: "middle", size: 11, fill: SUB });
  });
  g += txt(40, 40, "価格（毎回1万円ずつ購入）", { fill: INK, size: 12.5 });
  g += txt(320, 210, "高いときは少なく、安いときは多く買うことになる", { anchor: "middle", fill: UP, bold: true, size: 12.5 });
  save("dca", 640, 310, g);
}

/* ============ 18. リスクリワード比と必要勝率 ============ */
{
  let g = txt(320, 30, "損益がプラスマイナスゼロになる勝率（手数料除く・理論値）", { anchor: "middle", fill: INK, bold: true, size: 13 });
  const rows = [["1 : 1", 50], ["1 : 2", 33.3], ["1 : 3", 25], ["1 : 0.5", 66.7]];
  rows.forEach(([rr, wr], i) => {
    const y = 70 + i * 55;
    g += txt(95, y + 17, `損失 ${rr} 利益`, { anchor: "end", fill: INK, size: 13 });
    g += `<rect x="120" y="${y}" width="420" height="24" rx="4" fill="#e9eef5"/>`;
    g += `<rect x="120" y="${y}" width="${420 * wr / 100}" height="24" rx="4" fill="${wr > 50 ? DN : UP}"/>`;
    g += txt(548, y + 17, `${wr}%`, { size: 13, fill: INK, bold: true });
  });
  g += txt(320, 300, "利益を大きく取るほど、低い勝率でも成立する（逆もまた然り）", { anchor: "middle", size: 12.5, fill: SUB });
  save("risk-reward", 640, 320, g);
}

/* ============ 19. ナンピンの数学 ============ */
{
  const pts = [[40, 60], [110, 110], [170, 90], [240, 160], [300, 140], [370, 210], [430, 190], [500, 260]];
  let g = poly(pts, { color: INK });
  [[110, 110], [240, 160], [370, 210]].forEach(([x, y], i) => {
    g += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${DN}" stroke-width="2"/>`;
    g += txt(x + 10, y - 6, `買い${i + 1}（${1 * 2 ** i}単位）`, { fill: DN, size: 11.5 });
  });
  // 平均取得単価の低下
  g += line(110, 128, 520, 176, { color: LV, w: 2, dash: "5 4" });
  g += txt(528, 178, "平均取得単価", { fill: LV, size: 12 });
  g += txt(320, 46, "平均単価は下がるが、保有量が増えるため", { fill: DN, bold: true, size: 12.5 });
  g += txt(320, 64, "下落が続くと損失は加速度的に拡大する", { fill: DN, bold: true, size: 12.5 });
  save("nanpin", 640, 310, g);
}

/* ============ 20. 頭と尻尾はくれてやれ ============ */
{
  const pts = [[40, 250], [100, 220], [150, 235], [210, 170], [270, 190], [330, 120], [390, 140], [450, 80], [510, 100], [560, 70], [600, 90]];
  let g = poly(pts, { color: INK });
  // 底と天井
  g += `<circle cx="40" cy="250" r="9" fill="none" stroke="${SUB}" stroke-width="2" stroke-dasharray="3 2"/>`;
  g += txt(52, 268, "尻尾（底）＝狙わない", { fill: SUB, size: 12 });
  g += `<circle cx="560" cy="70" r="9" fill="none" stroke="${SUB}" stroke-width="2" stroke-dasharray="3 2"/>`;
  g += txt(548, 48, "頭（天井）＝狙わない", { fill: SUB, size: 12, anchor: "end" });
  // 胴体
  g += line(190, 300, 470, 300, { color: UP, w: 4 });
  g += arrow(210, 185, 300, 165, { color: UP, w: 0.01 });
  g += `<rect x="190" y="60" width="280" height="235" fill="${UP}" opacity="0.07"/>`;
  g += txt(330, 316, "胴体＝トレンドが確認できた区間だけを取りにいく", { anchor: "middle", fill: UP, bold: true, size: 12.5 });
  save("atama-shippo", 640, 330, g);
}

/* ============ 21. 休むも相場 ============ */
{
  let g = "";
  // 明瞭トレンド→不明瞭レンジ→明瞭
  g += poly([[30, 250], [90, 190], [140, 210], [200, 140]], { color: INK });
  g += poly([[200, 140], [235, 175], [265, 150], [300, 185], [335, 155], [370, 180], [400, 160]], { color: "#9aa9bf", w: 2 });
  g += poly([[400, 160], [460, 110], [510, 130], [580, 60]], { color: INK });
  g += `<rect x="200" y="60" width="200" height="200" fill="#9aa9bf" opacity="0.12"/>`;
  g += txt(300, 50, "方向感のない期間", { anchor: "middle", fill: SUB, bold: true, size: 12.5 });
  g += txt(300, 285, "無理に取引せず「待つ」のも選択肢", { anchor: "middle", fill: SUB, size: 12.5 });
  g += txt(110, 285, "分かりやすい局面", { anchor: "middle", fill: UP, size: 12 });
  g += txt(500, 285, "分かりやすい局面", { anchor: "middle", fill: UP, size: 12 });
  save("yasumu", 640, 310, g);
}

/* ============ 22. 人の行く裏に道あり（群集心理サイクル） ============ */
{
  const pts = [[40, 240], [110, 200], [180, 170], [250, 120], [320, 70], [390, 60], [450, 100], [510, 180], [570, 250]];
  let g = poly(pts, { color: INK });
  g += txt(150, 45, "楽観の頂点：皆が強気＝新たな買い手は残りわずか", { fill: DN, size: 12, bold: true });
  g += txt(570, 280, "悲観の底：皆が弱気", { anchor: "end", fill: UP, size: 12, bold: true });
  g += txt(100, 175, "「まだ早い」", { size: 11.5, fill: SUB });
  g += txt(250, 100, "「乗り遅れるな」", { size: 11.5, fill: SUB });
  g += txt(400, 95, "「今回は違う」", { size: 11.5, fill: SUB });
  g += txt(465, 130, "「やはり駄目だ」", { size: 11.5, fill: SUB });
  g += txt(320, 300, "格言は「多数派が極端に傾いたときこそ注意せよ」という戒めとして解釈される", { anchor: "middle", size: 12, fill: SUB });
  save("ura-michi", 640, 320, g);
}

/* ============ 23. プロスペクト理論（価値関数） ============ */
{
  let g = line(320, 30, 320, 270, { color: GRID, w: 1.5 });
  g += line(60, 150, 580, 150, { color: GRID, w: 1.5 });
  // 利益側（凹・緩やか）
  g += poly([[320, 150], [370, 118], [430, 96], [500, 82], [570, 74]], { color: UP, w: 3 });
  // 損失側（凸・急）
  g += poly([[320, 150], [285, 200], [245, 236], [195, 258], [130, 272], [70, 280]], { color: DN, w: 3 });
  g += txt(540, 60, "利益の喜び：伸びが鈍い", { anchor: "end", fill: UP, bold: true, size: 12.5 });
  g += txt(90, 300, "損失の痛み：同額の利益より約2倍強く感じるとされる", { fill: DN, bold: true, size: 12.5 });
  g += txt(330, 44, "満足", { size: 11.5 });
  g += txt(570, 165, "利益→", { size: 11.5, anchor: "end" });
  g += txt(70, 143, "←損失", { size: 11.5 });
  g += txt(320, 322, "損失を確定させる痛みを避けようとして損切りが遅れる、と説明される（プロスペクト理論）", { anchor: "middle", size: 12, fill: SUB });
  save("prospect", 640, 335, g);
}

/* ============ 24. ゴールデンクロス／デッドクロス（2パネル） ============ */
{
  let g = "";
  // GC
  g += poly([[30, 200], [90, 210], [150, 190], [210, 150], [280, 110]], { color: DN, w: 2.5 });
  g += poly([[30, 160], [90, 165], [150, 168], [210, 168], [280, 160]], { color: LV, w: 2.5 });
  g += `<circle cx="182" cy="172" r="9" fill="none" stroke="${UP}" stroke-width="2.5"/>`;
  g += txt(155, 250, "ゴールデンクロス", { anchor: "middle", bold: true, fill: UP });
  g += txt(155, 272, "短期線が長期線を上抜け＝買い基調の目安", { anchor: "middle", size: 11.5 });
  // DC
  const dx = 340;
  g += poly([[dx, 110], [dx + 60, 100], [dx + 120, 130], [dx + 180, 170], [dx + 250, 210]], { color: DN, w: 2.5 });
  g += poly([[dx, 150], [dx + 60, 148], [dx + 120, 146], [dx + 180, 148], [dx + 250, 155]], { color: LV, w: 2.5 });
  g += `<circle cx="${dx + 148}" cy="148" r="9" fill="none" stroke="${DN}" stroke-width="2.5"/>`;
  g += txt(dx + 155, 250, "デッドクロス", { anchor: "middle", bold: true, fill: DN });
  g += txt(dx + 155, 272, "短期線が長期線を下抜け＝売り基調の目安", { anchor: "middle", size: 11.5 });
  g += line(320, 40, 320, 280, { color: GRID, w: 1 });
  g += txt(150, 60, "─ 短期線", { fill: DN, size: 12 });
  g += txt(230, 60, "─ 長期線", { fill: LV, size: 12 });
  save("gc-dc", 640, 300, g);
}

/* ============ 25. RSI ============ */
{
  let g = "";
  // 上段: 価格（高値切り上げ）
  g += poly([[40, 90], [110, 60], [180, 80], [260, 45], [340, 70], [420, 35], [500, 55], [580, 30]], { color: INK });
  g += txt(50, 30, "価格：高値を更新", { fill: INK, size: 12 });
  // 下段: RSIバンド
  g += `<rect x="40" y="150" width="540" height="120" fill="#f7fafd" stroke="${GRID}"/>`;
  g += line(40, 180, 580, 180, { color: DN, w: 1.5, dash: "5 4" });
  g += line(40, 240, 580, 240, { color: UP, w: 1.5, dash: "5 4" });
  g += txt(588, 184, "70", { fill: DN, size: 11 });
  g += txt(588, 244, "30", { fill: UP, size: 11 });
  g += poly([[40, 230], [110, 170], [180, 205], [260, 165], [340, 215], [420, 185], [500, 225], [580, 205]], { color: LV, w: 2.5 });
  g += txt(50, 165, "RSI：高値が切り下がる（ダイバージェンス）", { fill: LV, size: 12, bold: true });
  g += arrow(265, 160, 425, 178, { color: SUB, w: 1 });
  g += txt(320, 296, "70以上=買われすぎ・30以下=売られすぎの目安。価格と逆行する形は勢いの衰えを示すとされる", { anchor: "middle", size: 11.5, fill: SUB });
  save("rsi", 640, 310, g);
}

/* ============ 26. リスクとリターン ============ */
{
  let g = line(70, 270, 590, 270, { color: INK, w: 1.5 });
  g += line(70, 270, 70, 40, { color: INK, w: 1.5 });
  g += txt(580, 292, "リスク（価格変動の大きさ）→", { anchor: "end", size: 12 });
  g += txt(60, 34, "期待リターン↑", { size: 12 });
  const assets = [["預金", 110, 245, "#71809a"], ["国債", 190, 220, "#2b4a8b"], ["社債", 270, 195, "#1f6e50"], ["株式(分散)", 370, 150, "#a3690f"], ["個別株", 460, 110, "#c73e2e"], ["暗号資産等", 545, 70, "#6b4fa0"]];
  assets.forEach(([name, x, y, c]) => {
    g += `<circle cx="${x}" cy="${y}" r="10" fill="${c}" opacity="0.85"/>`;
    g += txt(x, y - 18, name, { anchor: "middle", size: 12, fill: c, bold: true });
  });
  g += poly([[100, 252], [540, 62]], { color: GRID, w: 2, dash: "6 4" });
  g += txt(330, 318, "リターンが高いものはリスクも高い。「低リスク・高リターン」を謳うものは疑うのが原則（概念図）", { anchor: "middle", size: 11.5, fill: SUB });
  save("risk-return", 640, 330, g);
}

/* ============ 27. 分散投資 ============ */
{
  let g = "";
  g += poly([[40, 120], [100, 70], [160, 130], [220, 80], [280, 140], [340, 90], [400, 150], [460, 100], [520, 160], [580, 110]], { color: DN, w: 2 });
  g += poly([[40, 160], [100, 210], [160, 150], [220, 200], [280, 140], [340, 190], [400, 130], [460, 180], [520, 120], [580, 170]], { color: LV, w: 2 });
  g += poly([[40, 140], [100, 140], [160, 140], [220, 140], [280, 140], [340, 140], [400, 140], [460, 140], [520, 140], [580, 140]], { color: UP, w: 3.5 });
  g += txt(50, 55, "─ 資産A", { fill: DN, size: 12.5 });
  g += txt(130, 55, "─ 資産B（Aと逆に動く）", { fill: LV, size: 12.5 });
  g += txt(330, 55, "━ A+Bを半分ずつ持った場合", { fill: UP, size: 12.5, bold: true });
  g += txt(320, 250, "値動きの異なる資産を組み合わせると、全体の変動（リスク）がならされる", { anchor: "middle", fill: UP, bold: true, size: 12.5 });
  g += txt(320, 275, "※完全に逆に動く資産は現実には稀。相関が低いほど効果が大きい、が一般的な整理", { anchor: "middle", size: 11.5, fill: SUB });
  save("diversification", 640, 300, g);
}

/* ============ 28. ポジションサイジング（2%ルール比較） ============ */
{
  let g = txt(320, 30, "10連敗した場合の口座残高（1回の損失を残高の◯%に固定・理論値）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const pct2 = Array.from({ length: 11 }, (_, i) => 100 * 0.98 ** i);
  const pct10 = Array.from({ length: 11 }, (_, i) => 100 * 0.90 ** i);
  const X = (i) => 60 + i * 50;
  const Y = (v) => 260 - v * 1.9;
  g += poly(pct2.map((v, i) => [X(i), Y(v)]), { color: UP, w: 3 });
  g += poly(pct10.map((v, i) => [X(i), Y(v)]), { color: DN, w: 3 });
  g += txt(575, Y(pct2[10]) - 10, `2%固定 → 残高${Math.round(pct2[10])}%`, { anchor: "end", fill: UP, bold: true, size: 12.5 });
  g += txt(575, Y(pct10[10]) + 20, `10%固定 → 残高${Math.round(pct10[10])}%`, { anchor: "end", fill: DN, bold: true, size: 12.5 });
  g += line(60, 260, 580, 260, { color: INK, w: 1.5 });
  for (let i = 0; i <= 10; i += 2) g += txt(X(i), 280, `${i}敗`, { anchor: "middle", size: 11 });
  g += txt(320, 305, "1回のリスクを小さく保つほど、連敗しても再起できる資金が残る", { anchor: "middle", size: 12, fill: SUB });
  save("position-sizing", 640, 320, g);
}

/* ============ 29. 単利と複利 ============ */
{
  // 元本100・年利5%・30年（模式）
  let g = "";
  const X = (yr) => 60 + yr * 17.3;
  const Y = (v) => 280 - (v - 100) * 0.65;
  const simple = Array.from({ length: 31 }, (_, y) => [X(y), Y(100 + 5 * y)]);
  const comp = Array.from({ length: 31 }, (_, y) => [X(y), Y(100 * 1.05 ** y)]);
  g += poly(simple, { color: DN, w: 2.5 });
  g += poly(comp, { color: UP, w: 3 });
  g += line(60, 280, 590, 280, { color: INK, w: 1.5 });
  [0, 10, 20, 30].forEach((y) => g += txt(X(y), 298, `${y}年`, { anchor: "middle", size: 11 }));
  g += txt(575, Y(100 * 1.05 ** 30) + 4, `複利 約${Math.round(100 * 1.05 ** 30)}`, { anchor: "end", fill: UP, bold: true, size: 13 });
  g += txt(575, Y(250) + 4, `単利 250`, { anchor: "end", fill: DN, bold: true, size: 13 });
  g += txt(70, 45, "元本100・年5%で30年運用した場合（税・手数料除く理論値）", { size: 12.5, fill: SUB });
  g += txt(300, 130, "複利：利息が利息を生み、後半ほど差が開く", { fill: UP, bold: true, size: 12.5 });
  save("compound", 640, 315, g);
}

/* ============ 30. 金利とは（お金の値段） ============ */
{
  let g = "";
  g += `<rect x="60" y="90" width="180" height="120" rx="8" fill="#e9f2fb" stroke="${GRID}"/>`;
  g += txt(150, 140, "貸し手", { anchor: "middle", bold: true, fill: INK, size: 15 });
  g += txt(150, 165, "（預金者・投資家）", { anchor: "middle", size: 11.5 });
  g += `<rect x="400" y="90" width="180" height="120" rx="8" fill="#fff3e6" stroke="${GRID}"/>`;
  g += txt(490, 140, "借り手", { anchor: "middle", bold: true, fill: INK, size: 15 });
  g += txt(490, 165, "（企業・国・個人）", { anchor: "middle", size: 11.5 });
  g += arrow(250, 115, 390, 115, { color: DN, w: 2.5 });
  g += txt(320, 105, "お金を貸す", { anchor: "middle", fill: DN, size: 12.5 });
  g += arrow(390, 185, 250, 185, { color: UP, w: 2.5 });
  g += txt(320, 210, "元本＋金利を返す", { anchor: "middle", fill: UP, bold: true, size: 12.5 });
  g += txt(320, 255, "金利＝お金を一定期間借りる「値段」。", { anchor: "middle", fill: INK, bold: true, size: 13 });
  g += txt(320, 278, "期間が長いほど・返ってこない不安（信用リスク）が大きいほど高くなるのが原則", { anchor: "middle", size: 12, fill: SUB });
  save("interest", 640, 300, g);
}

/* ============ 31. 市場の全体地図 ============ */
{
  let g = txt(320, 32, "主な市場の全体地図（それぞれ値動きの理由が異なる）", { anchor: "middle", bold: true, fill: INK, size: 14 });
  const box = (x, y, title, c, lines) => {
    let s = `<rect x="${x}" y="${y}" width="260" height="110" rx="8" fill="#ffffff" stroke="${c}" stroke-width="2"/>`;
    s += `<rect x="${x}" y="${y}" width="260" height="30" rx="8" fill="${c}"/>`;
    s += txt(x + 130, y + 21, title, { anchor: "middle", fill: "#fff", bold: true, size: 13.5 });
    lines.forEach((t, i) => { s += txt(x + 14, y + 52 + i * 20, t, { size: 11.5, fill: INK }); });
    return s;
  };
  g += box(45, 55, "株式市場", "#2b4a8b", ["企業の所有権を売買", "業績・景気・金利で動く", "例：東証（日本取引所グループ）"]);
  g += box(335, 55, "債券市場", "#1f6e50", ["国や企業への貸付証書を売買", "金利と逆方向に価格が動く", "例：国債・社債"]);
  g += box(45, 185, "外国為替市場", "#a3690f", ["通貨同士を交換", "金利差・貿易・経済情勢で動く", "例：ドル/円（24時間取引）"]);
  g += box(335, 185, "コモディティ市場", "#6b4fa0", ["原油・金・穀物など実物", "需給・天候・地政学で動く", "例：金・原油先物"]);
  save("market-map", 640, 320, g);
}

/* ============ 32. 円安・円高 ============ */
{
  let g = txt(320, 34, "「1ドル＝何円か」で考える（数字が大きい＝円安）", { anchor: "middle", bold: true, fill: INK, size: 14 });
  // 中央軸
  g += line(120, 160, 520, 160, { color: INK, w: 2 });
  g += `<circle cx="320" cy="160" r="6" fill="${INK}"/>`;
  g += txt(320, 140, "1ドル＝100円", { anchor: "middle", fill: INK, bold: true, size: 13 });
  // 円高側
  g += arrow(300, 160, 140, 160, { color: DN, w: 2.5 });
  g += txt(150, 190, "1ドル＝80円", { fill: DN, bold: true, size: 13 });
  g += txt(150, 212, "円高：少ない円でドルが買える", { fill: DN, size: 12 });
  g += txt(150, 232, "＝円の価値が上がった", { fill: DN, size: 12 });
  // 円安側
  g += arrow(340, 160, 500, 160, { color: UP, w: 2.5 });
  g += txt(400, 190, "1ドル＝150円", { fill: UP, bold: true, size: 13 });
  g += txt(400, 212, "円安：多くの円が必要になる", { fill: UP, size: 12 });
  g += txt(400, 232, "＝円の価値が下がった", { fill: UP, size: 12 });
  g += txt(320, 285, "「数字が増えたのに円安？」と混乱したら、円の価値＝1円で買えるドルの量で考える", { anchor: "middle", size: 12, fill: SUB });
  save("yen-rate", 640, 305, g);
}

/* ===== 汎用ヘルパー: 見出し付きカード ===== */
function card(x, y, w, h, title, c, lines, { titleSize = 13.5, lineSize = 11.5 } = {}) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#ffffff" stroke="${c}" stroke-width="2"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="30" rx="8" fill="${c}"/>`;
  s += `<rect x="${x}" y="${y + 22}" width="${w}" height="8" fill="${c}"/>`;
  s += txt(x + w / 2, y + 21, title, { anchor: "middle", fill: "#fff", bold: true, size: titleSize });
  lines.forEach((t, i) => { s += txt(x + 14, y + 52 + i * 20, t, { size: lineSize, fill: INK }); });
  return s;
}

/* ============ 33. 新NISA ============ */
{
  let g = txt(320, 30, "NISA＝運用益が非課税になる制度の「箱」（2024年開始の新制度）", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(60, 55, 250, 130, "つみたて投資枠", "#1f6e50", ["対象: 積立・分散に適した", "一定の投資信託", "買い方: 積立", "年間投資枠: 120万円"]);
  g += card(330, 55, 250, 130, "成長投資枠", "#2b4a8b", ["対象: 上場株式・投資信託等", "（一部除外あり）", "買い方: 一括・積立", "年間投資枠: 240万円"]);
  g += `<rect x="60" y="205" width="520" height="52" rx="8" fill="#e9f2fb" stroke="${GRID}"/>`;
  g += txt(320, 227, "生涯の非課税保有限度額 1,800万円（うち成長投資枠は最大1,200万円）", { anchor: "middle", fill: INK, bold: true, size: 12.5 });
  g += txt(320, 247, "非課税期間は無期限・売却すると翌年以降に枠が復活", { anchor: "middle", size: 11.5, fill: SUB });
  g += txt(320, 285, "※金額・対象商品の最新条件は金融庁の公式情報を必ず確認してください", { anchor: "middle", size: 11, fill: SUB });
  save("nisa", 640, 300, g);
}

/* ============ 34. iDeCo（3段階の税優遇） ============ */
{
  let g = txt(320, 30, "iDeCo＝自分でつくる年金。3つの場面で税制上の扱いが異なる", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(40, 60, 170, 120, "① 拠出時", "#2b4a8b", ["掛金が全額", "所得控除の対象", "（所得税・住民税が", "　軽くなる）"]);
  g += card(235, 60, 170, 120, "② 運用時", "#1f6e50", ["運用益に", "課税されない", "（複利がそのまま", "　働く）"]);
  g += card(430, 60, 170, 120, "③ 受取時", "#a3690f", ["受け取り方に応じ", "課税（ただし", "退職所得控除等の", "控除がある）"]);
  g += arrow(212, 120, 232, 120, { color: SUB, w: 2 });
  g += arrow(407, 120, 427, 120, { color: SUB, w: 2 });
  g += `<rect x="40" y="200" width="560" height="46" rx="8" fill="#fff3e6" stroke="#f3d6b3"/>`;
  g += txt(320, 220, "最大の注意点: 原則60歳まで引き出せない（老後資金専用の制度）", { anchor: "middle", fill: "#b05a12", bold: true, size: 12.5 });
  g += txt(320, 238, "掛金の上限は職業・企業年金の有無で異なる（公式サイトで要確認）", { anchor: "middle", size: 11.5, fill: SUB });
  save("ideco", 640, 265, g);
}

/* ============ 35. 投資信託とETF ============ */
{
  let g = txt(320, 30, "どちらも「詰め合わせパック」。違いは売買のしかた", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(55, 55, 255, 165, "投資信託（非上場）", "#2b4a8b", ["取引: 販売会社経由で購入", "価格: 1日1回の基準価額", "　（注文時は価格未確定）", "最低額: 100円からも可", "積立: 自動積立が容易"]);
  g += card(330, 55, 255, 165, "ETF（上場投資信託）", "#1f6e50", ["取引: 証券取引所で売買", "価格: 取引時間中に変動", "　（指値・成行が使える）", "最低額: 1口数千円〜", "コスト: 信託報酬が低め傾向"]);
  g += txt(320, 250, "「リアルタイムに売買したいか」「自動積立を重視するか」が使い分けの軸とされる", { anchor: "middle", size: 12, fill: SUB });
  save("fund-etf", 640, 270, g);
}

/* ============ 36. インデックス投資 ============ */
{
  let g = "";
  const idx = [[40, 200], [110, 180], [180, 195], [250, 160], [320, 170], [390, 140], [460, 150], [530, 115], [590, 100]];
  const fund = idx.map(([x, y]) => [x, y + 7]);
  g += poly(idx, { color: INK, w: 2.5 });
  g += poly(fund, { color: UP, w: 2.5, dash: "6 3" });
  g += txt(560, 85, "市場平均（指数）", { anchor: "end", fill: INK, bold: true, size: 12.5 });
  g += txt(560, 130, "インデックスファンド（指数に連動）", { anchor: "end", fill: UP, size: 12 });
  g += txt(320, 250, "個別銘柄を選ばず「市場全体の平均点」を低コストで取りにいく考え方", { anchor: "middle", fill: INK, bold: true, size: 12.5 });
  g += txt(320, 272, "例: TOPIX・日経平均・S&P500 などの指数に連動する投資信託・ETF", { anchor: "middle", size: 11.5, fill: SUB });
  save("index-invest", 640, 290, g);
}

/* ============ 37. レバレッジ型ETFの減価 ============ */
{
  let g = txt(320, 28, "原指数が上下して元に戻っても、2倍型は元に戻らない（例: 100→90→99）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 原指数: 100 -> 90 (-10%) -> 99 (+10%)
  // 2倍型: 100 -> 80 (-20%) -> 96 (+20%)
  const X = [140, 320, 500];
  const Y = (v) => 250 - (v - 75) * 1.6;
  g += poly(X.map((x, i) => [x, Y([100, 90, 99][i])]), { color: INK, w: 2.5 });
  g += poly(X.map((x, i) => [x, Y([100, 80, 96][i])]), { color: DN, w: 2.5, dash: "6 3" });
  [[100, 90, 99], [100, 80, 96]].forEach((vals, s) => {
    vals.forEach((v, i) => {
      g += `<circle cx="${X[i]}" cy="${Y(v)}" r="4" fill="${s === 0 ? INK : DN}"/>`;
      g += txt(X[i] + (i === 2 ? 14 : 0), Y(v) + (s === 0 ? -10 : 20), `${v}`, { anchor: "middle", size: 12, fill: s === 0 ? INK : DN, bold: true });
    });
  });
  g += txt(555, Y(99) - 8, "原指数", { fill: INK, size: 12, bold: true });
  g += txt(555, Y(96) + 24, "2倍型", { fill: DN, size: 12, bold: true });
  [["当初", 0], ["-10%の日", 1], ["+10%の日", 2]].forEach(([t, i]) => g += txt(X[i], 285, t, { anchor: "middle", size: 11.5 }));
  g += txt(320, 315, "毎日「その日の2倍」を目指す仕組みのため、上下動を繰り返すと徐々に目減りする（減価）", { anchor: "middle", size: 12, fill: SUB });
  save("leveraged-etf", 640, 330, g);
}

/* ============ 38. FXの証拠金の仕組み ============ */
{
  let g = txt(320, 30, "FX＝証拠金を担保に、その何倍もの外貨を売買する取引", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += `<rect x="70" y="70" width="120" height="70" rx="6" fill="#e9f2fb" stroke="${DN}" stroke-width="2"/>`;
  g += txt(130, 100, "証拠金", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += txt(130, 122, "10万円", { anchor: "middle", fill: DN, bold: true, size: 14 });
  g += arrow(200, 105, 300, 105, { color: SUB, w: 2 });
  g += txt(250, 92, "最大25倍", { anchor: "middle", size: 11.5, fill: SUB });
  g += `<rect x="310" y="55" width="260" height="100" rx="6" fill="#fff3e6" stroke="#f3d6b3" stroke-width="2"/>`;
  g += txt(440, 90, "取引できる金額", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += txt(440, 118, "最大250万円分", { anchor: "middle", fill: "#b05a12", bold: true, size: 15 });
  g += txt(440, 140, "（国内個人の上限は25倍）", { anchor: "middle", size: 11, fill: SUB });
  g += txt(320, 195, "利益も損失も「取引金額」に対して発生 → 証拠金に対する損益の振れは25倍", { anchor: "middle", fill: DN, bold: true, size: 12.5 });
  g += txt(320, 220, "損失が膨らむと強制決済（ロスカット）。急変時は証拠金以上の損失が生じることもある", { anchor: "middle", size: 11.5, fill: SUB });
  save("fx-margin", 640, 240, g);
}

/* ============ 39. ブロックチェーン ============ */
{
  let g = txt(320, 30, "取引記録を「ブロック」にまとめ、鎖のようにつないで皆で持ち合う台帳", { anchor: "middle", bold: true, fill: INK, size: 13 });
  [0, 1, 2].forEach((i) => {
    const x = 90 + i * 170;
    g += `<rect x="${x}" y="70" width="130" height="80" rx="6" fill="#e9f2fb" stroke="${DN}" stroke-width="2"/>`;
    g += txt(x + 65, 95, `ブロック ${i + 1}`, { anchor: "middle", bold: true, fill: INK, size: 12.5 });
    g += txt(x + 65, 115, "取引記録の束", { anchor: "middle", size: 11 });
    g += txt(x + 65, 133, "＋前ブロックの指紋", { anchor: "middle", size: 10.5, fill: SUB });
    if (i < 2) g += arrow(x + 132, 110, x + 168, 110, { color: SUB, w: 2 });
  });
  g += txt(320, 180, "前のブロックの内容から作った「指紋（ハッシュ）」を次に埋め込むため、", { anchor: "middle", size: 12 });
  g += txt(320, 200, "過去の改ざんは後続すべてと矛盾して発覚する", { anchor: "middle", fill: DN, bold: true, size: 12.5 });
  g += txt(320, 232, "さらに同じ台帳を多数の参加者が持ち合う（分散）ため、単独での書き換えが困難とされる", { anchor: "middle", size: 11.5, fill: SUB });
  save("blockchain", 640, 250, g);
}

/* ============ 40. ビットコイン半減期 ============ */
{
  let g = txt(320, 28, "新規発行量（マイニング報酬）が約4年ごとに半分になる", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  const steps = [["2009", 50], ["2012", 25], ["2016", 12.5], ["2020", 6.25], ["2024", 3.125]];
  steps.forEach(([yr, v], i) => {
    const x = 60 + i * 108;
    const h = v * 3.4;
    g += `<rect x="${x}" y="${240 - h}" width="70" height="${h}" rx="3" fill="${UP}" opacity="${1 - i * 0.13}"/>`;
    g += txt(x + 35, 232 - h, `${v}`, { anchor: "middle", fill: UP, bold: true, size: 12.5 });
    g += txt(x + 35, 260, `${yr}年〜`, { anchor: "middle", size: 11.5 });
  });
  g += txt(320, 290, "単位: 1ブロックあたりの新規発行BTC。発行上限2,100万枚に向けて供給ペースが逓減する設計", { anchor: "middle", size: 11.5, fill: SUB });
  save("btc-halving", 640, 305, g);
}

/* ============ 41. ミームコインのリスク構造 ============ */
{
  let g = txt(320, 30, "ミームコインの典型的なリスク構造", { anchor: "middle", bold: true, fill: INK, size: 14 });
  g += card(45, 60, 260, 105, "価値の裏付け", "#6b4fa0", ["収益・利用実態などの", "裏付け資産がない", "→ 価格の拠り所は話題性のみ"]);
  g += card(335, 60, 260, 105, "保有の偏り", "#a3690f", ["少数の大口保有者に集中", "しがち → 大口の売りで", "価格が崩れやすい"]);
  g += card(45, 185, 260, 105, "流動性", "#1f6e50", ["買い手が細ると", "売りたくても売れない", "→ 急落が加速しやすい"]);
  g += card(335, 185, 260, 105, "詐欺・規制", "#c73e2e", ["開発者の持ち逃げ（ラグプル）", "や詐欺的な宣伝の事例", "→ 規制・注意喚起の対象に"]);
  save("memecoin-risk", 640, 310, g);
}

/* ============ 42. 先物とオプション ============ */
{
  let g = txt(320, 30, "先物＝約束（義務）、オプション＝チケット（権利）", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(55, 60, 255, 150, "先物取引", "#2b4a8b", ["将来の期日に、決めた価格で", "売買する「約束」", "", "買い手も売り手も義務を負う", "→ 損益はどちらも無限定"]);
  g += card(330, 60, 255, 150, "オプション取引", "#1f6e50", ["決めた価格で「買える／売れる", "権利」そのものを売買", "", "買い手: 損失は支払った代金まで", "売り手: 損失は無限定になりうる"]);
  g += txt(320, 245, "いずれも証拠金取引でレバレッジがかかる上級者向けの商品。仕組みの理解が先", { anchor: "middle", size: 12, fill: SUB });
  save("futures-options", 640, 265, g);
}

/* ============ 43. 金商法の全体像 ============ */
{
  let g = txt(320, 30, "金融商品取引法が規制する3つの領域（大づかみの地図）", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(40, 58, 180, 150, "業者への規制", "#2b4a8b", ["登録制・行為規制", "（勧誘ルール・", "　断定的判断の禁止・", "　適合性の原則など）"], { lineSize: 11 });
  g += card(230, 58, 180, 150, "情報開示の規制", "#1f6e50", ["有価証券報告書などの", "開示義務", "（投資判断の材料を", "　公平に提供させる）"], { lineSize: 11 });
  g += card(420, 58, 180, 150, "不公正取引の規制", "#c73e2e", ["インサイダー取引", "相場操縦", "風説の流布 など", "（違反には刑事罰も）"], { lineSize: 11 });
  g += txt(320, 240, "目的: 投資者の保護と、市場の公正性・透明性の確保（金商法1条）", { anchor: "middle", fill: INK, bold: true, size: 12.5 });
  save("fiel-map", 640, 260, g);
}

/* ============ 44. 相場操縦の類型 ============ */
{
  let g = txt(320, 30, "相場操縦の代表的な類型（いずれも金商法で禁止・刑事罰の対象）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += card(40, 58, 180, 155, "見せ玉（みせぎょく）", "#c73e2e", ["約定させる意思のない", "大量の注文を板に見せ、", "厚い買い/売りがあると", "誤解させて誘い込む"], { lineSize: 11, titleSize: 12.5 });
  g += card(230, 58, 180, 155, "仮装売買", "#a3690f", ["同一人物が自分自身と", "売買を成立させ、", "取引が活発だと", "見せかける"], { lineSize: 11, titleSize: 12.5 });
  g += card(420, 58, 180, 155, "馴合（なれあい）売買", "#6b4fa0", ["複数人が示し合わせて", "売買を繰り返し、", "出来高や価格を", "人為的に演出する"], { lineSize: 11, titleSize: 12.5 });
  g += txt(320, 243, "共通点: 「自然な需給で価格が決まっている」という市場への信頼を裏切る行為", { anchor: "middle", size: 12, fill: SUB });
  save("manipulation", 640, 262, g);
}

/* ============ 45. 断定的判断の提供の禁止 ============ */
{
  let g = txt(320, 30, "勧誘で禁止される「断定的判断の提供」（金商法38条）", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += `<rect x="45" y="55" width="260" height="150" rx="8" fill="#fdecea" stroke="#c73e2e" stroke-width="2"/>`;
  g += txt(175, 80, "✕ 禁止される言い方の例", { anchor: "middle", fill: "#c73e2e", bold: true, size: 13 });
  ["「必ず上がります」", "「絶対に損はさせません」", "「確実に2倍になります」"].forEach((t, i) => {
    g += txt(175, 110 + i * 28, t, { anchor: "middle", fill: INK, size: 12.5 });
  });
  g += `<rect x="335" y="55" width="260" height="150" rx="8" fill="#e8f6ec" stroke="#1d7a3e" stroke-width="2"/>`;
  g += txt(465, 80, "○ 適切な情報提供の例", { anchor: "middle", fill: "#1d7a3e", bold: true, size: 13 });
  ["リスクとリターンの両方を説明", "過去の実績と限界を示す", "判断材料の提供にとどめる"].forEach((t, i) => {
    g += txt(465, 110 + i * 28, t, { anchor: "middle", fill: INK, size: 12.5 });
  });
  g += txt(320, 235, "不確実な事柄に「確実」と誤解させる勧誘は違法。SNSの投資勧誘を見分ける物差しにもなる", { anchor: "middle", size: 12, fill: SUB });
  save("dantei-kinshi", 640, 255, g);
}

/* ============ 46. 暗号資産の規制地図 ============ */
{
  let g = txt(320, 30, "日本の暗号資産規制の大づかみな地図", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(40, 58, 180, 150, "資金決済法", "#2b4a8b", ["暗号資産の定義", "交換業者は登録制", "利用者財産の分別管理", "広告・勧誘規制"], { lineSize: 11 });
  g += card(230, 58, 180, 150, "金融商品取引法", "#1f6e50", ["暗号資産デリバティブ", "（証拠金取引）の規制", "不公正な行為の禁止", "レバレッジ上限2倍"], { lineSize: 11 });
  g += card(420, 58, 180, 150, "税制（所得税法）", "#a3690f", ["個人の売買益は", "原則「雑所得」で", "総合課税", "（給与等と合算・累進）"], { lineSize: 11 });
  g += txt(320, 240, "無登録業者・海外業者の勧誘には金融庁が繰り返し警告。登録の有無は金融庁サイトで確認できる", { anchor: "middle", size: 11.5, fill: SUB });
  save("crypto-regulation", 640, 260, g);
}

/* ============ 47. ステマ規制 ============ */
{
  let g = txt(320, 30, "ステルスマーケティング規制（2023年10月〜・景品表示法）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += `<rect x="45" y="58" width="260" height="140" rx="8" fill="#fdecea" stroke="#c73e2e" stroke-width="2"/>`;
  g += txt(175, 83, "✕ 規制対象", { anchor: "middle", fill: "#c73e2e", bold: true, size: 13 });
  ["広告なのに広告と", "分からない表示", "（事業者が依頼した投稿を", "　感想のように見せる等）"].forEach((t, i) => {
    g += txt(175, 108 + i * 22, t, { anchor: "middle", fill: INK, size: 12 });
  });
  g += `<rect x="335" y="58" width="260" height="140" rx="8" fill="#e8f6ec" stroke="#1d7a3e" stroke-width="2"/>`;
  g += txt(465, 83, "○ 求められる対応", { anchor: "middle", fill: "#1d7a3e", bold: true, size: 13 });
  ["「広告」「PR」等の", "明確な表示", "（投資情報の発信でも", "　報酬関係の明示が必要）"].forEach((t, i) => {
    g += txt(465, 108 + i * 22, t, { anchor: "middle", fill: INK, size: 12 });
  });
  g += txt(320, 228, "投資系SNS・動画の「案件」投稿は規制対象。PR表記のない称賛は疑って読むのが自衛策", { anchor: "middle", size: 12, fill: SUB });
  save("stealth-marketing", 640, 250, g);
}

/* ============ 48. 認知バイアス4種 ============ */
{
  let g = txt(320, 30, "投資判断を歪める代表的な認知バイアス", { anchor: "middle", bold: true, fill: INK, size: 14 });
  g += card(45, 58, 260, 105, "確証バイアス", "#2b4a8b", ["自分の見立てに都合の良い", "情報ばかり集めてしまう", "→ 買った銘柄の悪材料を無視"], { lineSize: 11 });
  g += card(335, 58, 260, 105, "アンカリング", "#1f6e50", ["最初に見た数字に引きずられる", "→「自分の買値」を基準に", "　売買を判断してしまう"], { lineSize: 11 });
  g += card(45, 180, 260, 105, "損失回避", "#c73e2e", ["同額でも損の痛みは利益の", "喜びの約2倍とされる", "→ 損切りの先送り・利益の早取り"], { lineSize: 11 });
  g += card(335, 180, 260, 105, "後知恵バイアス", "#a3690f", ["結果を見てから「分かっていた」", "と感じる → 検証なしに", "自分の相場観を過信する"], { lineSize: 11 });
  save("bias-map", 640, 305, g);
}

/* ============ 49. FOMO ============ */
{
  const pts = [[40, 250], [110, 235], [180, 210], [250, 170], [310, 110], [360, 60], [420, 45], [470, 90], [520, 160], [580, 230]];
  let g = poly(pts, { color: INK });
  g += txt(120, 210, "「自分には関係ない」", { size: 11.5, fill: SUB });
  g += txt(250, 145, "「まだ間に合うかも」", { size: 11.5, fill: SUB });
  g += `<circle cx="420" cy="45" r="9" fill="none" stroke="${DN}" stroke-width="2.5"/>`;
  g += txt(432, 40, "「乗り遅れる！」→ 飛び乗り", { fill: DN, bold: true, size: 12.5 });
  g += txt(500, 130, "高値づかみ", { fill: DN, size: 12 });
  g += txt(320, 290, "FOMO（取り残される恐怖）は、話題がピークに達した天井圏で最も強くなる", { anchor: "middle", fill: INK, bold: true, size: 12.5 });
  save("fomo", 640, 310, g);
}

/* ============ 50. トレード日誌のループ ============ */
{
  let g = txt(320, 30, "トレード日誌の改善ループ", { anchor: "middle", bold: true, fill: INK, size: 14 });
  const items = [["① 記録する", "根拠・感情・結果を", "その場で書く", "#2b4a8b", 60], ["② 集計する", "勝率・損益比・", "ルール順守率を数える", "#1f6e50", 200], ["③ 仮説を立てる", "「負けの共通点は", "　◯◯では？」", "#a3690f", 340], ["④ ひとつ変える", "次の期間は", "1点だけ修正して検証", "#c73e2e", 480]];
  items.forEach(([t, l1, l2, c, x]) => {
    g += `<rect x="${x - 8}" y="60" width="130" height="100" rx="8" fill="#ffffff" stroke="${c}" stroke-width="2"/>`;
    g += txt(x + 57, 88, t, { anchor: "middle", bold: true, fill: c, size: 12.5 });
    g += txt(x + 57, 115, l1, { anchor: "middle", size: 10.5 });
    g += txt(x + 57, 133, l2, { anchor: "middle", size: 10.5 });
  });
  [190, 330, 470].forEach((x) => g += arrow(x - 6, 110, x - 10 + 12, 110, { color: SUB, w: 2 }));
  g += poly([[545, 165], [545, 195], [80, 195], [80, 168]], { color: SUB, w: 1.5, dash: "5 4" });
  g += arrow(80, 175, 80, 163, { color: SUB, w: 1.5 });
  g += txt(320, 215, "感想文ではなく「数えられる記録」にするのがコツ（数字にできれば検証できる）", { anchor: "middle", size: 12, fill: SUB });
  save("trade-journal", 640, 235, g);
}

console.log("done");
