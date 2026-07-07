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

/* ============ 51. アルゴリズム取引とHFT ============ */
{
  let g = txt(320, 30, "アルゴリズム取引の主な類型", { anchor: "middle", bold: true, fill: INK, size: 14 });
  g += card(45, 58, 260, 100, "執行アルゴリズム", "#2b4a8b", ["大口注文を小分けにして", "市場への影響を抑えながら執行", "（機関投資家の標準装備）"], { lineSize: 11 });
  g += card(335, 58, 260, 100, "マーケットメイク型", "#1f6e50", ["売り買い両方の気配を出し続け", "小さな利ざやを高頻度で獲得", "（流動性の供給者でもある）"], { lineSize: 11 });
  g += card(45, 172, 260, 100, "裁定（アービトラージ）型", "#a3690f", ["現物と先物・市場間の", "わずかな価格差を瞬時に解消", "（価格の歪みを埋める）"], { lineSize: 11 });
  g += card(335, 172, 260, 100, "HFT（高頻度取引）", "#c73e2e", ["ミリ秒〜マイクロ秒単位で", "上記戦略を超高速に実行", "（日本では登録制の対象）"], { lineSize: 11 });
  save("algo-hft", 640, 292, g);
}

/* ============ 52. クオンツ運用のプロセス ============ */
{
  let g = txt(320, 30, "クオンツ運用の基本プロセス", { anchor: "middle", bold: true, fill: INK, size: 14 });
  const steps = [["データ", "価格・財務・", "オルタナティブ", "#2b4a8b"], ["仮説", "収益の源泉を", "数式で表現", "#1f6e50"], ["検証", "過去データで", "バックテスト", "#a3690f"], ["運用", "ルール通りに", "機械的に執行", "#c73e2e"], ["監視", "劣化を検知し", "改良・停止判断", "#6b4fa0"]];
  steps.forEach(([t, l1, l2, c], i) => {
    const x = 40 + i * 118;
    g += `<rect x="${x}" y="60" width="100" height="95" rx="8" fill="#ffffff" stroke="${c}" stroke-width="2"/>`;
    g += txt(x + 50, 87, t, { anchor: "middle", bold: true, fill: c, size: 13 });
    g += txt(x + 50, 112, l1, { anchor: "middle", size: 10.5 });
    g += txt(x + 50, 130, l2, { anchor: "middle", size: 10.5 });
    if (i < 4) g += arrow(x + 102, 107, x + 116, 107, { color: SUB, w: 2 });
  });
  g += txt(320, 190, "人間の裁量を「仮説づくり」に集中させ、売買の実行は規律（ルール）に任せる分業", { anchor: "middle", size: 12, fill: SUB });
  save("quant-process", 640, 210, g);
}

/* ============ 53. 過剰最適化 ============ */
{
  let g = txt(320, 28, "バックテストの罠：過去に完璧なほど、未来に弱い", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  // インサンプル: 右肩上がりの綺麗な曲線 / アウトオブサンプル: 崩壊
  g += line(320, 55, 320, 265, { color: GRID, w: 1.5, dash: "4 3" });
  g += txt(180, 70, "検証期間（インサンプル）", { anchor: "middle", size: 12, fill: SUB });
  g += txt(465, 70, "実運用（アウトオブサンプル）", { anchor: "middle", size: 12, fill: SUB });
  g += poly([[50, 240], [100, 220], [150, 195], [200, 165], [250, 130], [315, 90]], { color: UP, w: 3 });
  g += poly([[325, 90], [370, 115], [420, 105], [470, 150], [520, 185], [580, 230]], { color: DN, w: 3 });
  g += txt(150, 260, "パラメータを過去に合わせ込み", { anchor: "middle", size: 11.5 });
  g += txt(150, 278, "「完璧な成績」に見える", { anchor: "middle", size: 11.5 });
  g += txt(470, 260, "偶然のノイズに合わせていたため", { anchor: "middle", size: 11.5, fill: DN });
  g += txt(470, 278, "未知のデータで崩れる", { anchor: "middle", size: 11.5, fill: DN });
  save("overfitting", 640, 295, g);
}

/* ============ 54. 自動売買botの構成要素 ============ */
{
  let g = txt(320, 30, "自動売買botの一般的な構成要素", { anchor: "middle", bold: true, fill: INK, size: 14 });
  const steps = [["① データ取得", "価格・板・約定を", "APIで受信", "#2b4a8b"], ["② シグナル判定", "戦略ロジックで", "売買条件を評価", "#1f6e50"], ["③ リスク管理", "数量・上限・", "損切りを強制", "#c73e2e"], ["④ 発注・執行", "注文送信と", "約定確認・再送", "#a3690f"]];
  steps.forEach(([t, l1, l2, c], i) => {
    const x = 40 + i * 148;
    g += `<rect x="${x}" y="60" width="128" height="92" rx="8" fill="#ffffff" stroke="${c}" stroke-width="2"/>`;
    g += txt(x + 64, 86, t, { anchor: "middle", bold: true, fill: c, size: 12.5 });
    g += txt(x + 64, 110, l1, { anchor: "middle", size: 10.5 });
    g += txt(x + 64, 128, l2, { anchor: "middle", size: 10.5 });
    if (i < 3) g += arrow(x + 130, 106, x + 146, 106, { color: SUB, w: 2 });
  });
  g += `<rect x="40" y="175" width="560" height="50" rx="8" fill="#f7fafd" stroke="${GRID}"/>`;
  g += txt(320, 196, "⑤ 監視・ログ・緊急停止（すべての層を横断）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += txt(320, 215, "異常検知・通知・手動キルスイッチ。実運用では戦略ロジックより重要とされる層", { anchor: "middle", size: 11, fill: SUB });
  save("bot-architecture", 640, 245, g);
}

/* ============ 55. AI予測の限界 ============ */
{
  let g = txt(320, 30, "AI・機械学習が相場予測で直面する3つの壁", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(40, 58, 180, 135, "ノイズの多さ", "#2b4a8b", ["価格変動の大半は", "偶然のゆらぎ。", "学習対象の「正解」が", "そもそも薄い"], { lineSize: 11 });
  g += card(230, 58, 180, 135, "非定常性", "#a3690f", ["市場の性質そのものが", "時間とともに変わる。", "過去に学んだ規則性が", "将来も続く保証がない"], { lineSize: 11 });
  g += card(420, 58, 180, 135, "反射性", "#c73e2e", ["有効な予測は使われる", "ことで市場を動かし、", "その有効性自体が", "消えていく"], { lineSize: 11 });
  g += txt(320, 225, "画像認識のような「答えが固定された問題」と、相場という「答えが変わり続ける問題」の違い", { anchor: "middle", size: 12, fill: SUB });
  save("ai-limits", 640, 245, g);
}

/* ============ 56. 決算書3表のつながり ============ */
{
  let g = txt(320, 30, "財務3表のつながり（お金の流れの3つの視点）", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(40, 58, 180, 140, "損益計算書（PL）", "#1f6e50", ["一定期間の", "収益 − 費用 ＝ 利益", "", "「どれだけ稼いだか」"], { lineSize: 11 });
  g += card(230, 58, 180, 140, "貸借対照表（BS）", "#2b4a8b", ["ある時点の", "資産＝負債＋純資産", "", "「何を持ち何を借りているか」"], { lineSize: 10.5 });
  g += card(420, 58, 180, 140, "キャッシュフロー計算書", "#a3690f", ["一定期間の", "現金の出入り", "（営業・投資・財務）", "「現金は増えたか」"], { lineSize: 11 });
  g += arrow(222, 128, 228, 128, { color: SUB, w: 2 });
  g += arrow(412, 128, 418, 128, { color: SUB, w: 2 });
  g += txt(320, 225, "PLの利益はBSの純資産に積み上がり、CFは「利益と現金のズレ」を暴く。3枚セットで1つの物語", { anchor: "middle", size: 11.5, fill: SUB });
  save("financial-statements", 640, 245, g);
}

/* ============ 57. PER・PBR・配当利回り ============ */
{
  let g = txt(320, 30, "株価を測る3つの基本指標", { anchor: "middle", bold: true, fill: INK, size: 14 });
  g += card(40, 58, 180, 145, "PER（倍）", "#2b4a8b", ["株価 ÷ 1株あたり利益", "", "「利益の何年分の", "　値段が付いているか」"], { lineSize: 11 });
  g += card(230, 58, 180, 145, "PBR（倍）", "#1f6e50", ["株価 ÷ 1株あたり純資産", "", "「会社の帳簿上の価値の", "　何倍で買われているか」"], { lineSize: 10.5 });
  g += card(420, 58, 180, 145, "配当利回り（%）", "#a3690f", ["年間配当 ÷ 株価", "", "「株価に対して年何%の", "　配当を受け取れるか」"], { lineSize: 11 });
  g += txt(320, 232, "いずれも「割安/割高」の単独の答えにはならない。業種・成長性・時期との比較で初めて意味を持つ", { anchor: "middle", size: 11.5, fill: SUB });
  save("per-pbr-yield", 640, 252, g);
}

/* ============ 58. MACD ============ */
{
  let g = "";
  // 上段: 価格
  g += poly([[40, 80], [110, 95], [180, 70], [250, 85], [320, 60], [390, 50], [460, 65], [530, 45], [590, 55]], { color: INK, w: 2 });
  g += txt(50, 45, "価格", { size: 11.5, fill: SUB });
  // 下段: MACDとシグナル
  g += `<rect x="40" y="130" width="550" height="140" fill="#f7fafd" stroke="${GRID}"/>`;
  g += line(40, 200, 590, 200, { color: GRID, w: 1.2 });
  const macd = [[40, 245], [110, 235], [180, 218], [250, 195], [320, 175], [390, 162], [460, 168], [530, 182], [590, 192]];
  const sig = [[40, 252], [110, 246], [180, 234], [250, 214], [320, 192], [390, 176], [460, 172], [530, 176], [590, 184]];
  // ヒストグラム（MACD線とシグナル線の差を0ライン基準の棒で表現）
  macd.forEach(([x, y], i) => {
    const y2 = sig[i][1];
    const h = Math.abs((y2 - y) * 2.2);
    g += `<rect x="${x - 5}" y="${y2 > y ? 200 - h : 200}" width="10" height="${h}" fill="${y2 > y ? UP : DN}" opacity="0.45"/>`;
  });
  g += poly(macd, { color: DN, w: 2.5 });
  g += poly(sig, { color: LV, w: 2.5 });
  g += `<circle cx="238" cy="207" r="8" fill="none" stroke="${UP}" stroke-width="2.5"/>`;
  g += txt(160, 290, "MACD線がシグナル線を上抜け＝買い転換の目安", { fill: UP, size: 11.5, bold: true });
  g += txt(500, 150, "─ MACD線", { fill: DN, size: 11.5 });
  g += txt(500, 166, "─ シグナル線", { fill: LV, size: 11.5 });
  g += txt(45, 145, "0ライン", { size: 10.5, fill: SUB });
  save("macd", 640, 305, g);
}

/* ============ 59. ボリンジャーバンド ============ */
{
  let g = "";
  const mid = [[40, 160], [120, 158], [200, 155], [280, 150], [360, 140], [440, 125], [520, 110], [600, 100]];
  const spread = [26, 22, 14, 10, 26, 42, 48, 50]; // スクイーズ→エクスパンション
  const up = mid.map(([x, y], i) => [x, y - spread[i]]);
  const dn = mid.map(([x, y], i) => [x, y + spread[i]]);
  g += poly(up, { color: LV, w: 2 });
  g += poly(dn, { color: LV, w: 2 });
  g += poly(mid, { color: SUB, w: 1.5, dash: "4 3" });
  g += poly([[40, 165], [120, 150], [200, 160], [280, 148], [360, 128], [440, 96], [520, 78], [600, 66]], { color: INK, w: 2.5 });
  g += `<rect x="230" y="120" width="110" height="70" rx="6" fill="none" stroke="${DN}" stroke-width="1.5" stroke-dasharray="5 3"/>`;
  g += txt(285, 230, "スクイーズ（幅の収縮）", { anchor: "middle", fill: DN, size: 12, bold: true });
  g += txt(285, 250, "＝大きな動きの前兆とされる", { anchor: "middle", size: 11.5 });
  g += txt(505, 230, "エクスパンション（拡大）", { anchor: "middle", fill: UP, size: 12, bold: true });
  g += txt(505, 250, "＝トレンド発生を示唆", { anchor: "middle", size: 11.5 });
  g += txt(60, 60, "±2σバンド：統計的に約95%の値動きが収まるとされる帯", { size: 11.5, fill: SUB });
  save("bollinger", 640, 270, g);
}

/* ============ 60. 一目均衡表（雲） ============ */
{
  let g = "";
  // 雲: spanA/spanB
  const spanA = [[40, 150], [140, 145], [240, 135], [340, 128], [440, 118], [540, 112], [600, 110]];
  const spanB = [[40, 190], [140, 185], [240, 175], [340, 160], [440, 150], [540, 146], [600, 145]];
  let cloud = `M ${spanA.map((p) => p.join(" ")).join(" L ")} L ${spanB.slice().reverse().map((p) => p.join(" ")).join(" L ")} Z`;
  g += `<path d="${cloud}" fill="#a3690f" opacity="0.18"/>`;
  g += poly(spanA, { color: LV, w: 1.5 });
  g += poly(spanB, { color: LV, w: 1.5, dash: "4 3" });
  // 価格: 雲の下→突入→上抜け
  g += poly([[40, 250], [120, 235], [200, 240], [280, 210], [340, 175], [400, 155], [460, 125], [520, 100], [600, 80]], { color: INK, w: 2.5 });
  g += txt(120, 275, "雲の下＝弱い局面", { size: 11.5, fill: DN });
  g += txt(360, 210, "雲の中＝方向感の欠如", { size: 11.5, fill: SUB });
  g += txt(480, 70, "雲の上抜け＝強い局面への転換とされる", { size: 11.5, fill: UP, bold: true });
  g += txt(320, 305, "「雲」は先行スパン2本に挟まれた帯。厚い雲ほど抵抗帯として意識されるとされる", { anchor: "middle", size: 11.5, fill: SUB });
  save("ichimoku-cloud", 640, 320, g);
}

/* ============ 61. ストキャスティクス ============ */
{
  let g = "";
  g += poly([[40, 80], [110, 60], [180, 70], [250, 50], [320, 65], [390, 85], [460, 70], [530, 90], [590, 80]], { color: INK, w: 2 });
  g += txt(50, 40, "価格（レンジ気味の相場で機能しやすいとされる）", { size: 11.5, fill: SUB });
  g += `<rect x="40" y="120" width="550" height="150" fill="#f7fafd" stroke="${GRID}"/>`;
  g += line(40, 150, 590, 150, { color: DN, w: 1.5, dash: "5 4" });
  g += line(40, 240, 590, 240, { color: UP, w: 1.5, dash: "5 4" });
  g += txt(598, 154, "80", { fill: DN, size: 11 });
  g += txt(598, 244, "20", { fill: UP, size: 11 });
  const k = [[40, 230], [110, 140], [180, 165], [250, 132], [320, 190], [390, 252], [460, 225], [530, 258], [590, 235]];
  const d = [[40, 240], [110, 175], [180, 172], [250, 150], [320, 180], [390, 232], [460, 235], [530, 248], [590, 244]];
  g += poly(k, { color: DN, w: 2.2 });
  g += poly(d, { color: LV, w: 2.2 });
  g += txt(475, 135, "─ %K　─ %D（%Kの平均）", { size: 11, fill: SUB });
  g += `<circle cx="530" cy="253" r="8" fill="none" stroke="${UP}" stroke-width="2.2"/>`;
  g += txt(320, 292, "80以上=買われすぎ・20以下=売られすぎの目安。20以下での%K上抜けを反発の目安とする見方がある", { anchor: "middle", size: 11, fill: SUB });
  save("stochastics", 640, 305, g);
}

/* ============ 62. 窓と三空 ============ */
{
  let g = "";
  // 窓
  g += candle(80, 150, 155, 195, 205, { w: 20 });
  g += candle(130, 85, 90, 130, 140, { w: 20 });
  g += `<rect x="60" y="132" width="95" height="21" rx="3" fill="${UP}" opacity="0.15"/>`;
  g += txt(105, 230, "窓（ギャップ）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += txt(105, 250, "前日の高値と当日の安値の間に", { anchor: "middle", size: 10.5 });
  g += txt(105, 266, "取引のない空間ができる", { anchor: "middle", size: 10.5 });
  // 三空
  const dx = 300;
  [[0, 230, 195], [1, 185, 150], [2, 140, 105], [3, 95, 60]].forEach(([i, lo, hi]) => {
    g += candle(dx + 40 + i * 55, hi - 8, hi, lo, lo + 8, { w: 18 });
    if (i > 0) g += `<rect x="${dx + 40 + (i - 1) * 55 + 12}" y="${hi + 10}" width="30" height="12" fill="${UP}" opacity="0.18"/>`;
  });
  g += txt(dx + 125, 230, "三空（さんくう）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += txt(dx + 125, 250, "窓を3つ開けて一方向に走った状態。", { anchor: "middle", size: 10.5 });
  g += txt(dx + 125, 266, "「三空叩き込みは買い向かえ」等、過熱の目安とされる", { anchor: "middle", size: 10.5 });
  g += line(270, 40, 270, 275, { color: GRID, w: 1 });
  save("gaps-sanku", 640, 290, g);
}

/* ============ 63. ウェッジ ============ */
{
  let g = "";
  // 上昇ウェッジ（先細りで上へ・下放れしやすいとされる）
  g += poly([[40, 230], [90, 160], [130, 195], [180, 140], [220, 165], [260, 130], [290, 145]], { color: INK, w: 2 });
  g += poly([[40, 235], [290, 128]], { color: LV, w: 1.5, dash: "5 3" });
  g += poly([[75, 150], [295, 122]], { color: LV, w: 1.5, dash: "5 3" });
  g += arrow(292, 150, 305, 205, { color: DN, w: 2.2 });
  g += txt(165, 268, "上昇ウェッジ：先細りしながら切り上げ", { anchor: "middle", size: 11.5, bold: true, fill: INK });
  g += txt(165, 286, "→ 勢いの鈍化。下放れの警戒とされる", { anchor: "middle", size: 11, fill: DN });
  // 下降ウェッジ
  const dx = 340;
  g += poly([[dx, 90], [dx + 50, 165], [dx + 90, 130], [dx + 140, 185], [dx + 180, 158], [dx + 220, 195], [dx + 250, 180]], { color: INK, w: 2 });
  g += poly([[dx, 85], [dx + 255, 172]], { color: LV, w: 1.5, dash: "5 3" });
  g += poly([[dx + 30, 175], [dx + 258, 200]], { color: LV, w: 1.5, dash: "5 3" });
  g += arrow(dx + 252, 172, dx + 265, 120, { color: UP, w: 2.2 });
  g += txt(dx + 130, 268, "下降ウェッジ：先細りしながら切り下げ", { anchor: "middle", size: 11.5, bold: true, fill: INK });
  g += txt(dx + 130, 286, "→ 売り圧力の枯れ。上放れの候補とされる", { anchor: "middle", size: 11, fill: UP });
  g += line(320, 50, 320, 290, { color: GRID, w: 1 });
  save("wedges", 640, 305, g);
}

/* ============ 64. ボックスレンジ ============ */
{
  let g = "";
  g += line(50, 90, 480, 90, { color: DN, w: 2, dash: "6 4" });
  g += line(50, 210, 480, 210, { color: UP, w: 2, dash: "6 4" });
  g += `<rect x="50" y="90" width="430" height="120" fill="#2b4a8b" opacity="0.06"/>`;
  g += poly([[50, 190], [95, 100], [140, 200], [185, 95], [230, 205], [275, 98], [320, 195], [365, 102], [410, 190], [455, 100], [480, 85], [530, 60], [590, 40]], { color: INK, w: 2.2 });
  g += txt(60, 78, "上限（レジスタンス）", { size: 11.5, fill: DN });
  g += txt(60, 232, "下限（サポート）", { size: 11.5, fill: UP });
  g += `<circle cx="483" cy="84" r="8" fill="none" stroke="${LV}" stroke-width="2.2"/>`;
  g += txt(495, 65, "ブレイク", { fill: LV, bold: true, size: 12 });
  g += txt(320, 270, "ボックス（レンジ）：上下の水準の間を往復。逆張りが機能しやすい一方、ブレイクで環境が一変する", { anchor: "middle", size: 11.5, fill: SUB });
  save("box-range", 640, 290, g);
}

/* ============ 65. カップウィズハンドル ============ */
{
  let g = "";
  // カップ: U字
  const cup = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = 60 + t * 320;
    const y = 100 + Math.sin(Math.PI * t) * 110;
    cup.push([x, y]);
  }
  g += poly(cup, { color: INK, w: 2.5 });
  // ハンドル: 小さな下押し
  g += poly([[380, 100], [420, 125], [455, 115], [485, 130], [510, 108], [540, 95], [575, 60]], { color: INK, w: 2.5 });
  g += line(60, 98, 545, 98, { color: LV, w: 1.5, dash: "5 4" });
  g += txt(220, 250, "カップ（丸い底）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += txt(465, 160, "ハンドル（小さな押し）", { anchor: "middle", size: 11.5, fill: INK });
  g += `<circle cx="548" cy="92" r="8" fill="none" stroke="${UP}" stroke-width="2.2"/>`;
  g += txt(556, 78, "縁の上抜けで完成とされる", { fill: UP, size: 11.5, bold: true, anchor: "end" });
  g += txt(320, 290, "急角度のV字回復より、時間をかけた丸い底ほど信頼されやすい、という整理が知られる", { anchor: "middle", size: 11.5, fill: SUB });
  save("cup-handle", 640, 305, g);
}

/* ============ 66. ダウ理論（トレンドの定義と転換） ============ */
{
  let g = "";
  const pts = [[40, 250], [95, 180], [140, 215], [195, 140], [240, 175], [295, 105], [345, 150], [395, 125], [445, 190], [495, 160], [560, 240]];
  g += poly(pts, { color: INK, w: 2.5 });
  // 切り上げの印
  [[95, 180], [195, 140], [295, 105]].forEach(([x, y]) => g += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="${UP}" stroke-width="2"/>`);
  [[140, 215], [240, 175]].forEach(([x, y]) => g += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="${UP}" stroke-width="2" stroke-dasharray="3 2"/>`);
  g += txt(150, 80, "高値も安値も切り上げ＝上昇トレンド継続", { fill: UP, bold: true, size: 12.5 });
  // 転換
  g += `<circle cx="395" cy="125" r="7" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += `<circle cx="445" cy="190" r="7" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(400, 95, "高値切り下げ＋", { fill: DN, size: 12, bold: true });
  g += txt(400, 113, "安値切り下げ＝転換シグナル", { fill: DN, size: 12, bold: true });
  g += line(240, 178, 470, 178, { color: LV, w: 1.5, dash: "5 4" });
  g += txt(320, 285, "「明確な転換シグナルが出るまでトレンドは継続する」と考えるのがダウ理論の核心", { anchor: "middle", size: 12, fill: SUB });
  save("dow-theory", 640, 300, g);
}

/* ============ 67. グランビルの法則（買いの4局面） ============ */
{
  let g = "";
  const ma = [[40, 200], [120, 195], [200, 180], [280, 160], [360, 140], [440, 125], [520, 115], [600, 108]];
  g += poly(ma, { color: LV, w: 2.5 });
  g += txt(560, 95, "移動平均線", { fill: LV, size: 12 });
  const price = [[40, 240], [90, 215], [130, 185], [170, 150], [210, 175], [250, 150], [290, 120], [330, 95], [370, 130], [410, 118], [450, 80], [490, 110], [530, 132], [570, 100], [600, 70]];
  g += poly(price, { color: INK, w: 2 });
  const marks = [[130, 185, "①上抜け"], [210, 177, "②押し目"], [370, 132, "③反発"], [530, 136, "④乖離後の戻り"]];
  marks.forEach(([x, y, t]) => {
    g += `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="${UP}" stroke-width="2.2"/>`;
    g += txt(x, y + 28, t, { anchor: "middle", fill: UP, size: 11, bold: true });
  });
  g += txt(320, 290, "グランビルの買い4局面（売りはこの逆の4局面）。移動平均線と価格の位置関係で整理する", { anchor: "middle", size: 11.5, fill: SUB });
  save("granville", 640, 305, g);
}

/* ============ 68. トレーリングストップ ============ */
{
  let g = "";
  const price = [[40, 250], [100, 210], [150, 230], [210, 170], [260, 195], [320, 130], [370, 155], [430, 90], [480, 115], [530, 145], [570, 185]];
  g += poly(price, { color: INK, w: 2.5 });
  // 切り上がる損切りライン（階段）
  g += poly([[40, 280], [150, 280]], { color: UP, w: 2.5 });
  g += poly([[150, 245], [260, 245]], { color: UP, w: 2.5 });
  g += poly([[260, 205], [370, 205]], { color: UP, w: 2.5 });
  g += poly([[370, 165], [530, 165]], { color: UP, w: 2.5 });
  [[150, 280, 245], [260, 245, 205], [370, 205, 165]].forEach(([x, y1, y2]) => g += line(x, y1, x, y2, { color: UP, w: 1.5, dash: "3 2" }));
  g += `<circle cx="545" cy="165" r="8" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(430, 240, "上昇に合わせて損切りラインを切り上げる", { fill: UP, bold: true, size: 12, anchor: "middle" });
  g += txt(548, 145, "ライン到達で決済", { fill: DN, size: 11.5, bold: true, anchor: "end" });
  g += txt(320, 305, "利益を伸ばしつつ、確保した利益の一部を守る。「どこまで戻したら降りるか」を先に決める仕組み", { anchor: "middle", size: 11.5, fill: SUB });
  save("trailing-stop", 640, 320, g);
}

/* ============ 69. 分割売買 ============ */
{
  let g = txt(320, 28, "一括と分割 ― 同じ資金でも入り方で結果のブレが変わる", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 左: 一括
  g += poly([[50, 100], [110, 140], [170, 120], [230, 170], [280, 150]], { color: INK, w: 2 });
  g += `<circle cx="65" cy="110" r="8" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(80, 95, "一括投入", { fill: DN, size: 12, bold: true });
  g += txt(165, 230, "タイミングの当たり外れを", { anchor: "middle", size: 11.5 });
  g += txt(165, 248, "1回の判断が全て背負う", { anchor: "middle", size: 11.5 });
  // 右: 分割
  const dx = 340;
  g += poly([[dx, 100], [dx + 60, 140], [dx + 120, 120], [dx + 180, 170], [dx + 240, 150]], { color: INK, w: 2 });
  [[dx + 10, 108], [dx + 90, 132], [dx + 180, 170]].forEach(([x, y], i) => {
    g += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${UP}" stroke-width="2"/>`;
    g += txt(x, y - 14, `1/3`, { anchor: "middle", fill: UP, size: 10.5, bold: true });
  });
  g += txt(dx + 120, 230, "複数回に分けて平均化。", { anchor: "middle", size: 11.5 });
  g += txt(dx + 120, 248, "有利にも不利にもなり得るが、ブレは小さくなる", { anchor: "middle", size: 11.5 });
  g += line(320, 55, 320, 260, { color: GRID, w: 1 });
  save("scaling", 640, 275, g);
}

/* ============ 70. 見切り千両（損失の深さと回復必要率） ============ */
{
  let g = txt(320, 28, "損失が深いほど、取り返すのは急激に難しくなる", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  const rows = [[10, 11], [20, 25], [30, 43], [50, 100], [70, 233]];
  rows.forEach(([loss, need], i) => {
    const y = 60 + i * 44;
    g += txt(120, y + 16, `−${loss}%の損失`, { anchor: "end", fill: DN, size: 12.5, bold: true });
    const w = Math.min(need * 1.7, 400);
    g += `<rect x="140" y="${y}" width="${w}" height="22" rx="4" fill="${need > 100 ? DN : UP}" opacity="0.8"/>`;
    g += txt(148 + w, y + 16, `回復に +${need}% 必要`, { size: 12, fill: INK });
  });
  g += txt(320, 295, "「見切り千両」＝浅い傷のうちに逃げる判断には千両の価値がある、という格言の数理的な裏付け", { anchor: "middle", size: 11.5, fill: SUB });
  save("mikiri", 640, 310, g);
}

/* ============ 71. もうはまだなり ============ */
{
  let g = "";
  const pts = [[40, 60], [100, 110], [150, 90], [210, 160], [260, 140], [320, 205], [370, 185], [430, 245], [490, 230], [550, 265], [600, 258]];
  g += poly(pts, { color: INK, w: 2.5 });
  [[150, 90, "「もう底だろう」→まだ"], [260, 140, "「さすがにもう底」→まだ"], [370, 185, "「今度こそ底」→まだ"]].forEach(([x, y, t]) => {
    g += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${DN}" stroke-width="2"/>`;
    g += txt(x + 12, y - 8, t, { fill: DN, size: 11 });
  });
  g += `<circle cx="550" cy="265" r="7" fill="none" stroke="${UP}" stroke-width="2.2"/>`;
  g += txt(543, 292, "誰も底と言わなくなった頃が底、ということも", { fill: UP, size: 11.5, anchor: "end" });
  g += txt(320, 320, "「もう」と思うときはまだ途中、「まだ」と思うときはもう終わりに近い ― 自分の感覚を疑う格言", { anchor: "middle", size: 11.5, fill: SUB });
  save("mou-mada", 640, 335, g);
}

/* ============ 72. インフレと現金の実質価値 ============ */
{
  let g = txt(320, 28, "年2%のインフレが続いた場合の「現金100万円で買える量」（理論値）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const years = [0, 10, 20, 30];
  years.forEach((y, i) => {
    const v = Math.round(100 / 1.02 ** y);
    const h = v * 1.8;
    const x = 80 + i * 140;
    g += `<rect x="${x}" y="${250 - h}" width="80" height="${h}" rx="4" fill="${DN}" opacity="${1 - i * 0.18}"/>`;
    g += txt(x + 40, 238 - h, `${v}万円分`, { anchor: "middle", fill: DN, bold: true, size: 12.5 });
    g += txt(x + 40, 270, y === 0 ? "現在" : `${y}年後`, { anchor: "middle", size: 11.5 });
  });
  g += txt(320, 300, "物価が上がる＝同じ現金で買える量が減る。「現金は無リスク」はインフレ下では成り立たない", { anchor: "middle", size: 11.5, fill: SUB });
  save("inflation", 640, 315, g);
}

/* ============ 73. 金利と株価・為替の波及 ============ */
{
  let g = txt(320, 30, "金利上昇が各市場へ波及する代表的な経路（教科書的な整理）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += `<rect x="240" y="55" width="160" height="50" rx="8" fill="${INK}"/>`;
  g += txt(320, 86, "金利の上昇", { anchor: "middle", fill: "#fff", bold: true, size: 14 });
  g += arrow(250, 108, 140, 145, { color: SUB, w: 2 });
  g += arrow(320, 108, 320, 145, { color: SUB, w: 2 });
  g += arrow(390, 108, 500, 145, { color: SUB, w: 2 });
  g += card(40, 150, 180, 115, "株式", "#2b4a8b", ["借入コスト増で企業収益に逆風", "将来利益の割引率が上がり", "特に成長株の評価が圧縮", "→ 下落要因とされる"], { lineSize: 10.5 });
  g += card(230, 150, 180, 115, "債券", "#1f6e50", ["新発債の利回りが上がるほど", "既発債の魅力は低下", "→ 債券価格は下落", "（金利と逆方向）"], { lineSize: 10.5 });
  g += card(420, 150, 180, 115, "為替", "#a3690f", ["高金利通貨にお金が集まり", "その通貨高の要因に", "（日米金利差と円相場の", "　関係が代表例）"], { lineSize: 10.5 });
  g += txt(320, 295, "※常に成り立つ法則ではなく「金利がなぜ動いたか」で反応は変わる（景気過熱か・信用不安か）", { anchor: "middle", size: 11, fill: SUB });
  save("rates-assets", 640, 310, g);
}

/* ============ 74. 中央銀行の役割 ============ */
{
  let g = txt(320, 30, "中央銀行（日本銀行）の3つの顔と金融政策", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(40, 58, 180, 105, "発券銀行", "#2b4a8b", ["紙幣（日本銀行券）を", "発行する唯一の主体", "通貨の信認を守る"], { lineSize: 11 });
  g += card(230, 58, 180, 105, "銀行の銀行", "#1f6e50", ["民間銀行から預金を受け入れ", "資金を貸し出す", "決済システムの中核"], { lineSize: 11 });
  g += card(420, 58, 180, 105, "政府の銀行", "#a3690f", ["国庫金の出納を担う", "（政府の資金の", "　受け払いを処理）"], { lineSize: 11 });
  g += `<rect x="40" y="180" width="560" height="75" rx="8" fill="#e9f2fb" stroke="${GRID}"/>`;
  g += txt(320, 205, "金融政策：物価の安定を目的に、政策金利や資産買入れで世の中のお金の量・金利を調節", { anchor: "middle", fill: INK, bold: true, size: 12 });
  g += txt(320, 228, "利上げ＝経済の熱を冷ます／利下げ＝経済を温める。決定は金融政策決定会合（年8回）で公表", { anchor: "middle", size: 11, fill: SUB });
  save("central-bank", 640, 275, g);
}

/* ============ 75. 地政学リスクの波及経路 ============ */
{
  let g = txt(320, 30, "地政学リスク（紛争・対立）が市場へ波及する代表的な経路", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += `<rect x="230" y="55" width="180" height="46" rx="8" fill="${INK}"/>`;
  g += txt(320, 84, "地政学イベント", { anchor: "middle", fill: "#fff", bold: true, size: 13.5 });
  g += arrow(255, 104, 140, 140, { color: SUB, w: 2 });
  g += arrow(320, 104, 320, 140, { color: SUB, w: 2 });
  g += arrow(385, 104, 500, 140, { color: SUB, w: 2 });
  g += card(40, 145, 180, 110, "資源・供給網", "#a3690f", ["原油・穀物・半導体などの", "供給不安 → 価格急騰", "→ インフレ圧力に波及"], { lineSize: 10.5 });
  g += card(230, 145, 180, 110, "リスク回避", "#2b4a8b", ["株式などリスク資産から", "資金が引き上げられ", "「質への逃避」が起きる"], { lineSize: 10.5 });
  g += card(420, 145, 180, 110, "安全資産", "#1f6e50", ["金・米国債・スイスフラン", "などに資金が向かう傾向", "（時期により顔ぶれは変化）"], { lineSize: 10.5 });
  g += txt(320, 285, "※市場の反応は「事前にどこまで織り込んでいたか」次第。事件の大きさ＝下落の大きさではない", { anchor: "middle", size: 11, fill: SUB });
  save("geopolitics", 640, 300, g);
}

/* ============ 76. ドローダウン ============ */
{
  let g = "";
  const eq = [[40, 200], [100, 160], [150, 175], [210, 120], [260, 135], [310, 90], [360, 130], [410, 180], [460, 150], [510, 110], [560, 85], [600, 70]];
  g += poly(eq, { color: INK, w: 2.5 });
  // ピークとボトム
  g += line(310, 90, 470, 90, { color: LV, w: 1.5, dash: "5 4" });
  g += `<circle cx="310" cy="90" r="6" fill="none" stroke="${UP}" stroke-width="2"/>`;
  g += `<circle cx="410" cy="180" r="6" fill="none" stroke="${DN}" stroke-width="2"/>`;
  g += arrow(430, 95, 430, 175, { color: DN, w: 2 });
  g += txt(442, 140, "最大ドローダウン", { fill: DN, bold: true, size: 12.5 });
  g += txt(442, 158, "（ピークからの最大下落率）", { fill: DN, size: 11 });
  g += txt(310, 72, "資産のピーク", { anchor: "middle", fill: UP, size: 11.5 });
  g += txt(500, 210, "ピーク回復までの期間も", { size: 11.5, fill: SUB, anchor: "middle" });
  g += txt(500, 228, "重要な指標", { size: 11.5, fill: SUB, anchor: "middle" });
  g += txt(320, 275, "ドローダウン＝資産曲線の「山から谷への下落」。戦略のリスクは平均リターンよりここで測る", { anchor: "middle", size: 11.5, fill: SUB });
  save("drawdown", 640, 290, g);
}

/* ============ 77. レバレッジと破綻ライン ============ */
{
  let g = txt(320, 28, "レバレッジ倍率と「証拠金が尽きる逆行幅」（理論値・追証等を除く）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const rows = [[1, 100], [5, 20], [10, 10], [25, 4]];
  rows.forEach(([lev, adverse], i) => {
    const y = 62 + i * 50;
    g += txt(120, y + 16, `${lev}倍`, { anchor: "end", fill: INK, size: 13, bold: true });
    const w = adverse * 4.2;
    g += `<rect x="140" y="${y}" width="${w}" height="22" rx="4" fill="${lev >= 10 ? DN : UP}" opacity="0.85"/>`;
    g += txt(150 + w, y + 16, `逆行 ${adverse}% で証拠金の全額に相当する損失`, { size: 12, fill: INK });
  });
  g += txt(320, 290, "倍率が高いほど、日常的な値動きの範囲で全損水準に達する。レバレッジは「時間を買う代わりに誤差への耐性を売る」行為", { anchor: "middle", size: 10.5, fill: SUB });
  save("leverage-risk", 640, 305, g);
}

/* ============ 78. ケリー基準 ============ */
{
  let g = txt(320, 28, "賭ける割合と資産の長期成長率（勝率60%・損益比1:1の例）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 成長率カーブ: f* = 0.2 が最適。 g(f) = 0.6*ln(1+f) + 0.4*ln(1-f)
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const f = i / 50;
    const gr = 0.6 * Math.log(1 + f) + 0.4 * Math.log(1 - f);
    pts.push([60 + f * 1050, 200 - gr * 1400]);
  }
  g += poly(pts, { color: INK, w: 2.5 });
  g += line(60, 200, 600, 200, { color: GRID, w: 1.5 });
  g += `<circle cx="${60 + 0.2 * 1050}" cy="${200 - (0.6 * Math.log(1.2) + 0.4 * Math.log(0.8)) * 1400}" r="7" fill="none" stroke="${UP}" stroke-width="2.5"/>`;
  g += txt(60 + 0.2 * 1050, 130, "最適点（ケリー比率 f*＝20%）", { anchor: "middle", fill: UP, bold: true, size: 12 });
  g += txt(555, 185, "賭けすぎると", { anchor: "end", fill: DN, size: 11.5, bold: true });
  g += txt(555, 202, "成長率はマイナスへ", { anchor: "end", fill: DN, size: 11.5, bold: true });
  g += txt(100, 260, "0%", { anchor: "middle", size: 11 });
  g += txt(60 + 0.2 * 1050, 260, "20%", { anchor: "middle", size: 11 });
  g += txt(565, 260, "1回に賭ける割合 →", { anchor: "end", size: 11 });
  g += txt(320, 292, "最適点を超えた賭け金は、期待値がプラスでも長期では資産を破壊する（実務ではケリーの半分以下が推奨されがち）", { anchor: "middle", size: 10.5, fill: SUB });
  save("kelly", 640, 305, g);
}

/* ===== 用語集用ミニ図解 ===== */

/* ============ 79. 板（オーダーブック） ============ */
{
  let g = txt(320, 26, "板（気配値）の見方", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  const rows = [
    ["", "1,005円", "3,200株", DN], ["", "1,004円", "1,800株", DN], ["", "1,003円", "2,500株", DN],
    ["2,100株", "1,002円", "", UP], ["4,000株", "1,001円", "", UP], ["1,500株", "1,000円", "", UP],
  ];
  g += txt(180, 56, "買い注文（数量）", { anchor: "middle", size: 11.5, fill: UP, bold: true });
  g += txt(460, 56, "売り注文（数量）", { anchor: "middle", size: 11.5, fill: DN, bold: true });
  rows.forEach(([buy, price, sell, c], i) => {
    const y = 66 + i * 30;
    g += `<rect x="90" y="${y}" width="460" height="26" fill="${i % 2 ? "#f7fafd" : "#ffffff"}" stroke="${GRID}"/>`;
    g += txt(320, y + 18, price, { anchor: "middle", size: 12.5, fill: INK, bold: true });
    if (buy) g += txt(180, y + 18, buy, { anchor: "middle", size: 12, fill: UP });
    if (sell) g += txt(460, y + 18, sell, { anchor: "middle", size: 12, fill: DN });
  });
  g += line(90, 156, 550, 156, { color: LV, w: 2 });
  g += txt(566, 160, "↑最良売り気配と", { size: 10.5 });
  g += txt(566, 174, "　最良買い気配の境", { size: 10.5 });
  g += txt(320, 268, "価格ごとの売買注文の一覧表。厚い（数量が多い）価格帯は节目として意識される", { anchor: "middle", size: 11.5, fill: SUB });
  save("order-board", 640, 285, g);
}

/* ============ 80. スプレッド ============ */
{
  let g = txt(320, 28, "スプレッド＝買値と売値の差", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += `<rect x="80" y="70" width="200" height="60" rx="8" fill="#e8f6ec" stroke="#1d7a3e" stroke-width="2"/>`;
  g += txt(180, 95, "売れる値段（Bid）", { anchor: "middle", fill: "#1d7a3e", bold: true, size: 12.5 });
  g += txt(180, 118, "100.00円", { anchor: "middle", fill: INK, size: 14, bold: true });
  g += `<rect x="360" y="70" width="200" height="60" rx="8" fill="#e9f2fb" stroke="${DN}" stroke-width="2"/>`;
  g += txt(460, 95, "買える値段（Ask）", { anchor: "middle", fill: DN, bold: true, size: 12.5 });
  g += txt(460, 118, "100.05円", { anchor: "middle", fill: INK, size: 14, bold: true });
  g += arrow(290, 100, 350, 100, { color: LV, w: 2 });
  g += txt(320, 155, "差の0.05円＝スプレッド（実質的な取引コスト）", { anchor: "middle", fill: LV, bold: true, size: 12.5 });
  g += txt(320, 185, "買った瞬間はスプレッド分だけ含み損から始まる。流動性が高いほど狭く、薄いほど広がる", { anchor: "middle", size: 11.5, fill: SUB });
  save("spread", 640, 205, g);
}

/* ============ 81. スリッページ ============ */
{
  let g = txt(320, 28, "スリッページ＝注文時の価格と約定価格のズレ", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const pts = [[60, 160], [140, 150], [220, 155], [300, 140], [340, 100], [400, 70], [480, 85], [560, 60]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<circle cx="300" cy="140" r="7" fill="none" stroke="${UP}" stroke-width="2.2"/>`;
  g += txt(290, 175, "「ここで買う」と注文", { anchor: "end", size: 11.5, fill: UP });
  g += `<circle cx="345" cy="97" r="7" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(358, 92, "実際に約定した価格", { size: 11.5, fill: DN });
  g += arrow(310, 133, 338, 105, { color: SUB, w: 1.5 });
  g += txt(320, 225, "急変時・流動性が薄いときほど大きくなる。成行注文・逆指値の執行で特に注意", { anchor: "middle", size: 11.5, fill: SUB });
  save("slippage", 640, 240, g);
}

/* ============ 82. 証拠金・追証・ロスカットの流れ ============ */
{
  let g = txt(320, 28, "証拠金取引の防衛ライン（証拠金維持率の低下と措置）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const rows = [["含み損の拡大", "証拠金維持率が低下していく", "#71809a"], ["追証（マージンコール）", "維持率が基準を下回ると追加入金を要求される", "#a3690f"], ["ロスカット", "さらに下回ると強制決済（急変時は間に合わないことも）", "#c73e2e"]];
  rows.forEach(([t, d, c], i) => {
    const y = 55 + i * 62;
    g += `<rect x="70" y="${y}" width="500" height="48" rx="8" fill="#ffffff" stroke="${c}" stroke-width="2"/>`;
    g += txt(90, y + 22, t, { fill: c, bold: true, size: 13 });
    g += txt(90, y + 40, d, { size: 11, fill: INK });
    if (i < 2) g += arrow(320, y + 50, 320, y + 60, { color: SUB, w: 2 });
  });
  g += txt(320, 262, "ロスカットは投資家保護の仕組みだが、預けた資金以上の損失を防ぐ保証ではない", { anchor: "middle", size: 11.5, fill: SUB });
  save("margin-flow", 640, 278, g);
}

/* ============ 83. イールドカーブ ============ */
{
  let g = txt(320, 28, "イールドカーブ＝期間ごとの金利をつないだ曲線", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 順イールド
  g += poly([[80, 220], [180, 190], [280, 170], [380, 158], [480, 150], [560, 146]], { color: UP, w: 2.5 });
  // 逆イールド
  g += poly([[80, 160], [180, 175], [280, 190], [380, 200], [480, 208], [560, 212]], { color: DN, w: 2.5, dash: "6 3" });
  g += line(80, 240, 560, 240, { color: INK, w: 1.5 });
  ["1年", "5年", "10年", "20年", "30年"].forEach((t, i) => g += txt(130 + i * 100, 258, t, { anchor: "middle", size: 11 }));
  g += txt(565, 150, "順イールド", { fill: UP, size: 11.5, bold: true });
  g += txt(565, 216, "逆イールド", { fill: DN, size: 11.5, bold: true });
  g += txt(320, 290, "通常は長い期間ほど金利が高い（順）。短期＞長期の逆転（逆イールド）は景気後退の先行サインとして注目されてきた", { anchor: "middle", size: 10.5, fill: SUB });
  save("yield-curve", 640, 305, g);
}

/* ============ 84. ベーシスポイント ============ */
{
  let g = txt(320, 30, "1ベーシスポイント（bp）＝ 0.01%", { anchor: "middle", bold: true, fill: INK, size: 15 });
  const rows = [["1bp", "0.01%", 6], ["25bp", "0.25%", 150], ["100bp", "1.00%", 400]];
  rows.forEach(([bp, pct, w], i) => {
    const y = 70 + i * 55;
    g += txt(120, y + 17, bp, { anchor: "end", fill: DN, bold: true, size: 14 });
    g += `<rect x="140" y="${y}" width="${w}" height="24" rx="4" fill="${DN}" opacity="${0.5 + i * 0.25}"/>`;
    g += txt(150 + w, y + 17, `＝ ${pct}`, { size: 13, fill: INK });
  });
  g += txt(320, 265, "金利の変化を正確に伝えるための単位。「政策金利を25bp引き上げ」＝0.25%の利上げ", { anchor: "middle", size: 11.5, fill: SUB });
  save("basis-point", 640, 280, g);
}

/* ============ 85. ロングとショート ============ */
{
  let g = txt(320, 28, "ロング（買い）とショート（売り）", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  // ロング
  g += poly([[60, 180], [130, 150], [200, 120], [270, 90]], { color: UP, w: 2.5 });
  g += arrow(200, 120, 270, 90, { color: UP, w: 0.1 });
  g += txt(165, 215, "ロング：安く買って高く売る", { anchor: "middle", fill: UP, bold: true, size: 12 });
  g += txt(165, 235, "上がれば利益・下がれば損失", { anchor: "middle", size: 11 });
  // ショート
  const dx = 350;
  g += poly([[dx, 90], [dx + 70, 120], [dx + 140, 150], [dx + 210, 180]], { color: DN, w: 2.5 });
  g += txt(dx + 105, 215, "ショート：借りて売り、下がったら買い戻す", { anchor: "middle", fill: DN, bold: true, size: 12 });
  g += txt(dx + 105, 235, "下がれば利益・上がれば損失（理論上損失無限定）", { anchor: "middle", size: 10.5 });
  g += line(320, 55, 320, 245, { color: GRID, w: 1 });
  save("long-short", 640, 260, g);
}

/* ============ 86. ヘッジ ============ */
{
  let g = txt(320, 28, "ヘッジ＝保有資産の値下がりリスクを打ち消す取引", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += poly([[70, 120], [150, 140], [230, 170], [310, 200]], { color: DN, w: 2.5 });
  g += txt(190, 225, "保有株の下落（損失）", { anchor: "middle", fill: DN, size: 11.5 });
  g += poly([[330, 200], [410, 170], [490, 140], [570, 120]], { color: UP, w: 2.5 });
  g += txt(450, 225, "先物の売り等の利益が相殺", { anchor: "middle", fill: UP, size: 11.5 });
  g += `<rect x="240" y="70" width="160" height="36" rx="18" fill="#e9f2fb" stroke="${DN}"/>`;
  g += txt(320, 93, "損益がならされる", { anchor: "middle", fill: INK, bold: true, size: 12.5 });
  g += txt(320, 262, "保険と同じで、コスト（ヘッジ費用）を払って不確実性を減らす。上昇の利益も削られる", { anchor: "middle", size: 11.5, fill: SUB });
  save("hedge", 640, 278, g);
}

/* ============ 87. 逆指値 ============ */
{
  let g = txt(320, 28, "逆指値＝「不利な方向に動いたら」執行される予約注文", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const pts = [[60, 150], [140, 130], [220, 145], [300, 125], [380, 140], [460, 165], [540, 185]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += line(60, 190, 560, 190, { color: DN, w: 2, dash: "6 4" });
  g += txt(70, 210, "売り逆指値（ここまで下がったら売る＝損切りの自動化）", { size: 11.5, fill: DN, bold: true });
  g += line(60, 100, 560, 100, { color: UP, w: 2, dash: "6 4" });
  g += txt(70, 90, "買い逆指値（ここまで上がったら買う＝ブレイク追随）", { size: 11.5, fill: UP, bold: true });
  g += txt(320, 250, "通常の指値が「有利な価格で」なのに対し、逆指値は「不利な方向への動きを条件に」執行される", { anchor: "middle", size: 11.5, fill: SUB });
  save("stop-order", 640, 265, g);
}

/* ============ 88. 含み損益 ============ */
{
  let g = txt(320, 28, "含み損益＝決済していないポジションの評価上の損益", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += line(60, 150, 580, 150, { color: LV, w: 2, dash: "5 4" });
  g += txt(66, 142, "買値", { size: 11.5, fill: LV });
  const pts = [[100, 150], [170, 120], [240, 135], [310, 100], [380, 130], [450, 170], [520, 190]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<rect x="100" y="100" width="320" height="50" fill="${UP}" opacity="0.08"/>`;
  g += `<rect x="420" y="150" width="140" height="45" fill="${DN}" opacity="0.10"/>`;
  g += txt(260, 92, "含み益の期間", { anchor: "middle", fill: UP, size: 11.5, bold: true });
  g += txt(500, 212, "含み損の期間", { anchor: "middle", fill: DN, size: 11.5, bold: true });
  g += txt(320, 255, "決済して初めて損益は確定する。ただし「まだ損じゃない」は先送りの心理でもある（塩漬けの入口）", { anchor: "middle", size: 11.5, fill: SUB });
  save("unrealized-pl", 640, 270, g);
}

/* ===== バブル史シリーズ ===== */

/* ============ 89. チューリップバブル ============ */
{
  let g = txt(320, 28, "チューリップ球根価格の推移（1634〜1637年・模式図）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const pts = [[60, 240], [140, 232], [220, 215], [300, 185], [360, 140], [400, 95], [430, 60], [445, 52], [460, 90], [480, 170], [510, 230], [560, 250]];
  let g2 = poly(pts, { color: INK, w: 2.5 });
  g += g2;
  g += `<circle cx="445" cy="52" r="8" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(430, 40, "1637年2月：買い手が突然消える", { anchor: "end", fill: DN, bold: true, size: 12 });
  g += txt(200, 200, "「球根1個＝家1軒」の逸話も", { size: 11.5, fill: SUB });
  g += txt(320, 285, "現物の球根ではなく「球根を買う権利」の転売が投機の主戦場になっていた（先物的取引の原型）", { anchor: "middle", size: 11, fill: SUB });
  save("tulip-bubble", 640, 300, g);
}

/* ============ 90. 南海泡沫事件とニュートン ============ */
{
  let g = txt(320, 28, "南海会社株とニュートンの売買（1720年・逸話に基づく模式図）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  const pts = [[60, 240], [130, 225], [200, 195], [260, 150], [320, 90], [380, 55], [420, 50], [460, 100], [500, 180], [550, 245]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<circle cx="200" cy="195" r="7" fill="none" stroke="${UP}" stroke-width="2"/>`;
  g += txt(190, 178, "①購入", { fill: UP, size: 11, bold: true, anchor: "end" });
  g += `<circle cx="260" cy="150" r="7" fill="none" stroke="${UP}" stroke-width="2"/>`;
  g += txt(250, 133, "②利益確定（一度は勝ち逃げ）", { fill: UP, size: 11, anchor: "end" });
  g += `<circle cx="380" cy="55" r="7" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(370, 40, "③高値圏で再参入", { fill: DN, size: 11, bold: true, anchor: "end" });
  g += `<circle cx="500" cy="180" r="7" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(512, 185, "④暴落で大損", { fill: DN, size: 11, bold: true });
  g += txt(320, 280, "「天体の動きは計算できるが、人々の狂気は計算できない」（ニュートンの言葉と伝えられる）", { anchor: "middle", size: 11, fill: SUB });
  save("south-sea", 640, 295, g);
}

/* ============ 91. 平成バブル ============ */
{
  let g = txt(320, 28, "日経平均株価の軌跡（1985〜1992年・模式図）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const pts = [[60, 230], [120, 205], [180, 175], [240, 140], [300, 100], [350, 65], [390, 48], [430, 80], [470, 130], [510, 175], [560, 210]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<circle cx="390" cy="48" r="8" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(390, 32, "1989年末 38,915円（史上最高値・当時）", { anchor: "middle", fill: DN, size: 11.5, bold: true });
  g += txt(150, 155, "プラザ合意後の金融緩和", { size: 11, fill: SUB });
  g += txt(170, 172, "「土地は下がらない」神話", { size: 11, fill: SUB });
  g += txt(480, 110, "金融引き締め・", { size: 11, fill: DN });
  g += txt(480, 126, "総量規制を機に崩壊", { size: 11, fill: DN });
  g += txt(320, 275, "回復には30年以上を要した（2024年に最高値更新）。「バブルは崩壊後の処理が本番」の代表例", { anchor: "middle", size: 11, fill: SUB });
  save("heisei-bubble", 640, 290, g);
}

/* ============ 92. ITバブル ============ */
{
  let g = txt(320, 28, "ナスダック総合指数の軌跡（1995〜2002年・模式図）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const pts = [[60, 235], [130, 220], [200, 195], [260, 160], [310, 115], [350, 70], [385, 45], [420, 85], [455, 140], [495, 185], [540, 225], [570, 240]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<circle cx="385" cy="45" r="8" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(385, 30, "2000年3月 5,048（ピーク）", { anchor: "middle", fill: DN, size: 11.5, bold: true });
  g += txt(180, 150, "「社名に.comを付ければ株価が上がる」", { size: 11, fill: SUB });
  g += txt(200, 167, "利益なき企業への熱狂", { size: 11, fill: SUB });
  g += txt(470, 250, "ピークから約78%下落", { size: 11, fill: DN, anchor: "middle" });
  g += txt(320, 285, "ただしインターネット自体は本物だった——「技術の正しさ」と「価格の正しさ」は別問題", { anchor: "middle", size: 11, fill: SUB });
  save("dotcom-bubble", 640, 300, g);
}

/* ============ 93. 住宅バブルとリーマン ============ */
{
  let g = txt(320, 28, "米住宅バブル（〜2008年）の連鎖構造", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  const steps = [["住宅価格の上昇神話", "「住宅価格は全国では下がらない」", "#2b4a8b"], ["低所得者向けローン拡大", "サブプライムローン・審査の劣化", "#1f6e50"], ["証券化で世界に拡散", "ローンを束ねた金融商品を世界の投資家が保有", "#a3690f"], ["価格下落で連鎖崩壊", "2008年9月リーマン・ブラザーズ破綻→世界金融危機", "#c73e2e"]];
  steps.forEach(([t, d, c], i) => {
    const y = 52 + i * 56;
    g += `<rect x="80" y="${y}" width="480" height="44" rx="8" fill="#ffffff" stroke="${c}" stroke-width="2"/>`;
    g += txt(100, y + 20, t, { fill: c, bold: true, size: 12.5 });
    g += txt(100, y + 37, d, { size: 10.5, fill: INK });
    if (i < 3) g += arrow(320, y + 46, 320, y + 54, { color: SUB, w: 2 });
  });
  g += txt(320, 296, "レバレッジと複雑な金融商品が、局所的な住宅バブルを世界的な危機に増幅した", { anchor: "middle", size: 11, fill: SUB });
  save("housing-lehman", 640, 310, g);
}

/* ============ 94. 暗号資産の熱狂サイクル ============ */
{
  let g = txt(320, 28, "ビットコインの急騰・急落サイクル（模式図・概数）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const pts = [[50, 250], [110, 240], [150, 180], [180, 60], [210, 160], [240, 230], [290, 235], [340, 200], [380, 90], [410, 55], [450, 150], [480, 215], [520, 190], [560, 120], [590, 100]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<circle cx="180" cy="60" r="7" fill="none" stroke="${DN}" stroke-width="2"/>`;
  g += txt(180, 45, "2017年末", { anchor: "middle", fill: DN, size: 11, bold: true });
  g += txt(238, 255, "▲約8割下落", { anchor: "middle", fill: DN, size: 10.5 });
  g += `<circle cx="410" cy="55" r="7" fill="none" stroke="${DN}" stroke-width="2"/>`;
  g += txt(410, 40, "2021年", { anchor: "middle", fill: DN, size: 11, bold: true });
  g += txt(480, 240, "▲約7割下落", { anchor: "middle", fill: DN, size: 10.5 });
  g += txt(320, 285, "急騰と大幅下落を繰り返してきた。過去のサイクルの反復が将来も続く保証はない", { anchor: "middle", size: 11, fill: SUB });
  save("crypto-cycles", 640, 300, g);
}

/* ============ 95. バブルの5段階（キンドルバーガー＝ミンスキー） ============ */
{
  let g = txt(320, 26, "バブルの5段階モデル（キンドルバーガー＝ミンスキー・モデル）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const stages = [["① 転換点", "新技術・新制度の登場", "#2b4a8b"], ["② 信用膨張", "カネ余り・借入で買う", "#1f6e50"], ["③ 陶酔", "「今回は違う」の大合唱", "#a3690f"], ["④ 利益確定", "内部者・賢いカネが売る", "#6b4fa0"], ["⑤ パニック", "我先の売り・信用収縮", "#c73e2e"]];
  stages.forEach(([t, d, c], i) => {
    const x = 40 + i * 118;
    g += `<rect x="${x}" y="55" width="102" height="90" rx="8" fill="#ffffff" stroke="${c}" stroke-width="2"/>`;
    g += txt(x + 51, 82, t, { anchor: "middle", bold: true, fill: c, size: 12 });
    d.split("・").forEach((line, j) => g += txt(x + 51, 106 + j * 16, line, { anchor: "middle", size: 9.5 }));
    if (i < 4) g += arrow(x + 104, 100, x + 116, 100, { color: SUB, w: 2 });
  });
  // 価格カーブ
  const pts = [[60, 250], [170, 235], [280, 200], [370, 155], [430, 175], [520, 260], [580, 275]];
  g += poly(pts, { color: INK, w: 2 });
  g += txt(320, 300, "17世紀のチューリップから現代まで、対象は変われど段階の骨格は繰り返し観察されてきた", { anchor: "middle", size: 11, fill: SUB });
  save("minsky-stages", 640, 315, g);
}

/* ============ 96. AIブームをバブルの物差しで見る ============ */
{
  let g = txt(320, 28, "AIブームに「バブルの物差し」を当てる（判定は事後にしか確定しない）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += `<rect x="45" y="55" width="260" height="180" rx="8" fill="#e8f6ec" stroke="#1d7a3e" stroke-width="2"/>`;
  g += txt(175, 80, "実体を示す側の材料", { anchor: "middle", fill: "#1d7a3e", bold: true, size: 12.5 });
  ["技術の実用は現実に進行", "一部企業には巨額の収益", "インフラ投資は実需を伴う", "（ITバブル期の「利益なき", "　熱狂」とは異なる面）"].forEach((t, i) => g += txt(175, 108 + i * 24, t, { anchor: "middle", size: 11 }));
  g += `<rect x="335" y="55" width="260" height="180" rx="8" fill="#fdecea" stroke="#c73e2e" stroke-width="2"/>`;
  g += txt(465, 80, "過熱を疑う側の材料", { anchor: "middle", fill: "#c73e2e", bold: true, size: 12.5 });
  ["期待が業績の先を走る銘柄群", "「AI」を冠するだけの便乗", "設備投資の回収は未検証", "少数銘柄への資金集中", "「今回は違う」という語り"].forEach((t, i) => g += txt(465, 108 + i * 24, t, { anchor: "middle", size: 11 }));
  g += txt(320, 262, "技術が本物であることと、個々の価格が正当であることは別問題（ITバブルの教訓）", { anchor: "middle", fill: INK, bold: true, size: 12 });
  g += txt(320, 284, "投資家にできるのは判定ではなく、どちらに転んでも生き残るポジション設計", { anchor: "middle", size: 11, fill: SUB });
  save("ai-boom-lens", 640, 300, g);
}

/* ============ 97. イナゴタワー ============ */
{
  let g = txt(320, 26, "「イナゴタワー」の典型形（模式図）", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  const pts = [[50, 240], [130, 235], [200, 228], [250, 180], [280, 100], [300, 60], [320, 55], [340, 90], [360, 150], [390, 210], [440, 235], [520, 242], [590, 245]];
  g += poly(pts, { color: INK, w: 2.5 });
  // 出来高
  const vols = [[250, 20], [280, 55], [300, 75], [320, 80], [340, 62], [360, 40], [390, 22]];
  vols.forEach(([x, h]) => g += `<rect x="${x - 8}" y="${300 - h}" width="16" height="${h}" fill="${UP}" opacity="0.6"/>`);
  g += txt(240, 165, "SNS・掲示板で話題化→買いが殺到", { size: 11, fill: UP, anchor: "end" });
  g += `<circle cx="320" cy="55" r="8" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(335, 48, "数日で天井", { fill: DN, size: 11.5, bold: true });
  g += txt(430, 180, "熱が冷めると買い手不在で急落", { size: 11, fill: DN });
  g += txt(320, 322, "細く高く立ち上がり崩れる形が「タワー」の由来。上げの速さと下げの速さはほぼ対称になりやすい", { anchor: "middle", size: 11, fill: SUB });
  save("inago-tower", 640, 335, g);
}

/* ============ 98. バブル格言マップ ============ */
{
  let g = txt(320, 26, "相場サイクルと「バブルの格言」", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  const pts = [[50, 250], [130, 225], [210, 185], [290, 130], [360, 75], [420, 60], [480, 120], [540, 210], [590, 260]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += txt(120, 205, "「強気相場は悲観の中で生まれ…」", { size: 10.5, fill: SUB });
  g += txt(255, 108, "「まだはもうなり」", { size: 10.5, fill: SUB });
  g += txt(420, 42, "「靴磨きの少年が株を語ったら売り」", { anchor: "middle", size: 11, fill: DN, bold: true });
  g += txt(505, 95, "「音楽が止まっても", { size: 10.5, fill: DN });
  g += txt(505, 110, "　踊り続けてしまう」", { size: 10.5, fill: DN });
  g += txt(545, 245, "「今回は違う、は", { size: 10.5, fill: SUB, anchor: "end" });
  g += txt(545, 260, "　最も高くつく言葉」", { size: 10.5, fill: SUB, anchor: "end" });
  g += txt(320, 300, "格言は予測の道具ではなく、熱狂の中で自分の位置を疑うためのチェックリスト", { anchor: "middle", size: 11.5, fill: SUB });
  save("bubble-proverbs", 640, 315, g);
}

/* ===== 損切りシリーズ ===== */

/* ============ 99. 損切りの3つの問い ============ */
{
  let g = txt(320, 30, "損切りの設計は3つの問いに分解できる", { anchor: "middle", bold: true, fill: INK, size: 14 });
  g += card(40, 58, 180, 140, "① なぜ切るのか", "#2b4a8b", ["買った理由（シナリオ）が", "崩れたと判定できる場所", "だから切る。", "価格の痛みではなく", "根拠の消滅で切る"], { lineSize: 10.5 });
  g += card(230, 58, 180, 140, "② どこで切るのか", "#a3690f", ["テクニカル基準", "（構造が壊れる場所）", "×ボラティリティ基準", "（ノイズの外側）", "×資金基準（2%以内）"], { lineSize: 10.5 });
  g += card(420, 58, 180, 140, "③ どう実行するか", "#c73e2e", ["エントリーと同時に", "逆指値を置く。", "その場の判断を", "残さないのが", "唯一の心理対策"], { lineSize: 10.5 });
  g += txt(320, 232, "3つの答えがエントリー前に揃っていない売買は、サイズ・期待値・心理のすべてが未設計", { anchor: "middle", size: 11.5, fill: SUB });
  save("losscut-3q", 640, 250, g);
}

/* ============ 100. テクニカル基準の損切り位置 ============ */
{
  let g = "";
  const pts = [[40, 250], [100, 200], [150, 225], [210, 160], [260, 190], [320, 130], [380, 155], [440, 100]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<circle cx="320" cy="130" r="7" fill="none" stroke="${UP}" stroke-width="2.2"/>`;
  g += txt(332, 125, "買い", { fill: UP, size: 12, bold: true });
  g += line(240, 196, 460, 196, { color: DN, w: 2, dash: "6 4" });
  g += txt(468, 200, "損切り：直近安値の少し下", { fill: DN, size: 11.5, bold: true });
  g += txt(468, 218, "（安値割れ＝上昇の定義の崩壊）", { size: 10.5, fill: SUB });
  g += line(240, 206, 460, 206, { color: GRID, w: 1 });
  g += txt(140, 285, "「上昇トレンド（安値切り上げ）が続く」というシナリオが", { size: 11.5, fill: SUB });
  g += txt(140, 303, "否定される場所に置く＝価格ではなく構造で決める", { size: 11.5, fill: SUB });
  save("losscut-technical", 640, 320, g);
}

/* ============ 101. ボラティリティ基準（ATR） ============ */
{
  let g = txt(320, 26, "同じ「3%の逆行」でも、銘柄の呼吸の大きさで意味が違う", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 静かな銘柄
  g += poly([[50, 130], [90, 125], [130, 132], [170, 126], [210, 133], [250, 127], [290, 131]], { color: INK, w: 2 });
  g += line(50, 155, 290, 155, { color: DN, w: 1.5, dash: "5 3" });
  g += txt(170, 190, "日々の振れ幅(ATR)が1%の銘柄", { anchor: "middle", size: 11.5 });
  g += txt(170, 208, "→ 3%逆行は明確な異常＝有効な損切り", { anchor: "middle", size: 11, fill: UP, bold: true });
  // 荒い銘柄
  const dx = 340;
  g += poly([[dx, 145], [dx + 40, 100], [dx + 80, 150], [dx + 120, 95], [dx + 160, 155], [dx + 200, 105], [dx + 240, 140]], { color: INK, w: 2 });
  g += line(dx, 170, dx + 240, 170, { color: DN, w: 1.5, dash: "5 3" });
  g += txt(dx + 120, 190, "日々の振れ幅(ATR)が4%の銘柄", { anchor: "middle", size: 11.5 });
  g += txt(dx + 120, 208, "→ 3%逆行はただのノイズ＝即ヒットして損切り貧乏", { anchor: "middle", size: 10.5, fill: DN, bold: true });
  g += line(320, 50, 320, 215, { color: GRID, w: 1 });
  g += txt(320, 250, "損切り幅は固定%ではなく、その銘柄の平均的な振れ幅（ATR）の倍数で決めるのがボラ基準", { anchor: "middle", size: 11.5, fill: SUB });
  save("atr-stop", 640, 265, g);
}

/* ============ 102. タイムストップ ============ */
{
  let g = "";
  const pts = [[50, 150], [110, 130], [170, 145], [230, 138], [290, 150], [350, 142], [410, 152], [470, 145]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<circle cx="110" cy="130" r="7" fill="none" stroke="${UP}" stroke-width="2.2"/>`;
  g += txt(100, 113, "買い：ブレイクの継続を想定", { fill: UP, size: 11.5, anchor: "start" });
  g += `<rect x="110" y="90" width="300" height="130" fill="${LV}" opacity="0.08"/>`;
  g += line(410, 90, 410, 220, { color: LV, w: 2, dash: "6 4" });
  g += txt(418, 105, "想定期間（例：10営業日）", { fill: LV, size: 11.5, bold: true });
  g += txt(418, 123, "が経過しても伸びない", { fill: LV, size: 11.5 });
  g += txt(418, 145, "→ シナリオ不発として撤退", { fill: DN, size: 11.5, bold: true });
  g += txt(320, 265, "価格の損切りに掛からなくても「起きるはずのことが起きない」のはシナリオの否定。", { anchor: "middle", size: 11.5, fill: SUB });
  g += txt(320, 283, "資金と注意力を無期限に拘束させないための時間の損切り", { anchor: "middle", size: 11.5, fill: SUB });
  save("time-stop", 640, 300, g);
}

/* ============ 103. OCO注文（利確と損切りの同時設置） ============ */
{
  let g = txt(320, 26, "OCO注文：利確の指値と損切りの逆指値を同時に置く", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const pts = [[60, 170], [130, 150], [200, 165], [270, 140], [340, 155], [410, 135], [480, 148]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += line(60, 85, 560, 85, { color: UP, w: 2, dash: "6 4" });
  g += txt(568, 89, "利確の指値", { fill: UP, size: 11.5, bold: true });
  g += line(60, 215, 560, 215, { color: DN, w: 2, dash: "6 4" });
  g += txt(568, 219, "損切りの逆指値", { fill: DN, size: 11.5, bold: true });
  g += `<circle cx="130" cy="150" r="7" fill="none" stroke="${INK}" stroke-width="2"/>`;
  g += txt(142, 145, "エントリーと同時に両方セット", { size: 11.5, fill: INK, bold: true });
  g += txt(320, 250, "どちらかが約定したらもう一方は自動キャンセル。以後の判断（＝感情の介入余地）をゼロにする", { anchor: "middle", size: 11.5, fill: SUB });
  save("oco-order", 640, 265, g);
}

/* ============ 104. 損切り貧乏 ============ */
{
  let g = txt(320, 26, "損切り貧乏：ノイズの内側に置かれたストップが連続ヒットする", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  const pts = [[50, 180], [90, 140], [130, 175], [170, 130], [210, 170], [250, 120], [290, 160], [330, 110], [370, 150], [410, 95], [450, 130], [490, 80], [540, 60]];
  g += poly(pts, { color: INK, w: 2 });
  // 近すぎるストップの連続ヒット
  [[90, 140, 178], [170, 130, 172], [250, 120, 162]].forEach(([bx, by, sy], i) => {
    g += `<circle cx="${bx}" cy="${by}" r="5" fill="none" stroke="${UP}" stroke-width="1.8"/>`;
    g += line(bx - 15, sy, bx + 55, sy, { color: DN, w: 1.5, dash: "3 2" });
    g += `<circle cx="${bx + 40}" cy="${sy}" r="5" fill="${DN}"/>`;
  });
  g += txt(180, 220, "買い→浅いストップ→ヒット、を3連発", { size: 11.5, fill: DN, bold: true });
  g += txt(180, 238, "方向は正しかったのに損失だけ積み上がる", { size: 11.5, fill: DN });
  g += txt(440, 45, "相場は結局上昇", { size: 11.5, fill: UP, bold: true, anchor: "middle" });
  g += txt(320, 275, "原因は「損切りが早い」ことではなく「エントリーとストップの設計が銘柄の呼吸と合っていない」こと", { anchor: "middle", size: 11, fill: SUB });
  save("losscut-binbo", 640, 290, g);
}

/* ============ 105. 損切り幅と総損益の関係 ============ */
{
  let g = txt(320, 26, "損切り幅を変えると成績はどう変わるか（検証の典型的な形状）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  // 山型カーブ: 狭すぎ→損切り貧乏 / 広すぎ→1回の損が重い
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    const y = -((x - 0.45) ** 2) * 3.2 + 0.65; // 山
    pts.push([70 + x * 480, 220 - y * 180]);
  }
  g += poly(pts, { color: INK, w: 2.5 });
  g += line(70, 220, 550, 220, { color: GRID, w: 1.5 });
  g += txt(110, 250, "狭すぎ：", { anchor: "middle", size: 11.5, fill: DN, bold: true });
  g += txt(110, 267, "ノイズで連続ヒット", { anchor: "middle", size: 10.5 });
  g += txt(310, 250, "適正帯：構造の外側×資金の許容内", { anchor: "middle", size: 11.5, fill: UP, bold: true });
  g += txt(520, 250, "広すぎ：", { anchor: "middle", size: 11.5, fill: DN, bold: true });
  g += txt(520, 267, "1回の損失が重すぎる", { anchor: "middle", size: 10.5 });
  g += txt(60, 60, "総損益", { size: 11.5, fill: INK });
  g += txt(555, 214, "損切り幅→", { size: 11 });
  g += txt(320, 295, "最適点はピンポイントでは存在しない。「山の広い頂上付近」にいることを検証で確認する", { anchor: "middle", size: 11, fill: SUB });
  save("stop-width-curve", 640, 310, g);
}

/* ============ 106. 長期投資と損切りの要否 ============ */
{
  let g = txt(320, 28, "「長期投資に損切りは不要」が成り立つ条件・成り立たない条件", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += `<rect x="45" y="55" width="260" height="175" rx="8" fill="#e8f6ec" stroke="#1d7a3e" stroke-width="2"/>`;
  g += txt(175, 80, "損切り不要論が成り立ちうる", { anchor: "middle", fill: "#1d7a3e", bold: true, size: 12 });
  ["広く分散された指数への積立", "（個別企業の倒産リスクなし）", "経済全体の長期成長に賭ける設計", "時間分散で高値掴みを平均化", "→「売らない」こと自体が戦略"].forEach((t, i) => g += txt(175, 108 + i * 24, t, { anchor: "middle", size: 10.5 }));
  g += `<rect x="335" y="55" width="260" height="175" rx="8" fill="#fdecea" stroke="#c73e2e" stroke-width="2"/>`;
  g += txt(465, 80, "損切り不要論が危険", { anchor: "middle", fill: "#c73e2e", bold: true, size: 12 });
  ["個別株（ゼロになり得る）", "テーマ株・話題株の高値掴み", "「長期投資」が塩漬けの言い訳に", "なっているケース", "→ 撤退基準は依然として必要"].forEach((t, i) => g += txt(465, 108 + i * 24, t, { anchor: "middle", size: 10.5 }));
  g += txt(320, 258, "分けるのは投資期間ではなく「個別リスクを負っているか」と「買った根拠が今も生きているか」", { anchor: "middle", size: 11, fill: SUB });
  save("longterm-losscut", 640, 275, g);
}

/* ============ 107. 損益通算 ============ */
{
  let g = txt(320, 28, "損益通算：損失の確定が税負担を軽くする（上場株式等・概要）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += `<rect x="70" y="60" width="150" height="60" rx="8" fill="#e8f6ec" stroke="#1d7a3e" stroke-width="2"/>`;
  g += txt(145, 85, "A株の利益", { anchor: "middle", fill: "#1d7a3e", bold: true, size: 12.5 });
  g += txt(145, 106, "+100万円", { anchor: "middle", fill: INK, size: 13, bold: true });
  g += `<rect x="70" y="140" width="150" height="60" rx="8" fill="#fdecea" stroke="#c73e2e" stroke-width="2"/>`;
  g += txt(145, 165, "B株の損切り", { anchor: "middle", fill: "#c73e2e", bold: true, size: 12.5 });
  g += txt(145, 186, "−40万円", { anchor: "middle", fill: INK, size: 13, bold: true });
  g += arrow(230, 130, 300, 130, { color: SUB, w: 2 });
  g += `<rect x="310" y="95" width="180" height="70" rx="8" fill="#e9f2fb" stroke="${DN}" stroke-width="2"/>`;
  g += txt(400, 122, "課税対象は相殺後の", { anchor: "middle", fill: INK, size: 12 });
  g += txt(400, 145, "60万円に", { anchor: "middle", fill: DN, size: 14, bold: true });
  g += txt(400, 200, "（相殺しきれない損失は", { anchor: "middle", size: 10.5, fill: SUB });
  g += txt(400, 216, "　確定申告で翌年以後3年間繰越可）", { anchor: "middle", size: 10.5, fill: SUB });
  g += txt(320, 255, "損切りには「税負担の軽減」という現実的な副産物がある。※NISA口座の損失は損益通算不可", { anchor: "middle", size: 11, fill: SUB });
  save("tax-loss-offset", 640, 270, g);
}

/* ============ 108. 実務家のルール（オニール8%とR） ============ */
{
  let g = txt(320, 26, "実務家の損切りルールの代表例", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  // オニール
  g += poly([[60, 120], [120, 105], [180, 130], [240, 155], [290, 175]], { color: INK, w: 2 });
  g += `<circle cx="120" cy="105" r="6" fill="none" stroke="${UP}" stroke-width="2"/>`;
  g += txt(132, 100, "買値", { fill: UP, size: 11 });
  g += line(60, 170, 290, 170, { color: DN, w: 2, dash: "5 3" });
  g += txt(62, 190, "買値の7〜8%下：例外なく売る", { size: 11, fill: DN, bold: true });
  g += txt(175, 230, "オニールの機械的ルール", { anchor: "middle", size: 11.5, bold: true, fill: INK });
  g += txt(175, 248, "「例外を作らない」ことが本体", { anchor: "middle", size: 10.5, fill: SUB });
  // R倍数
  const dx = 350;
  g += `<rect x="${dx}" y="150" width="220" height="40" rx="4" fill="${DN}" opacity="0.15"/>`;
  g += txt(dx + 110, 175, "1R＝損切りまでの距離（許容損失）", { anchor: "middle", size: 11, fill: DN, bold: true });
  g += `<rect x="${dx}" y="70" width="220" height="70" rx="4" fill="${UP}" opacity="0.12"/>`;
  g += txt(dx + 110, 100, "利益は 2R・3R… と", { anchor: "middle", size: 11, fill: UP, bold: true });
  g += txt(dx + 110, 118, "R（初期リスク）の倍数で測る", { anchor: "middle", size: 11, fill: UP });
  g += txt(dx + 110, 230, "タープのR倍数思考", { anchor: "middle", size: 11.5, bold: true, fill: INK });
  g += txt(dx + 110, 248, "損切り距離が全取引の共通単位になる", { anchor: "middle", size: 10.5, fill: SUB });
  g += line(320, 50, 320, 255, { color: GRID, w: 1 });
  save("pro-stop-rules", 640, 270, g);
}

/* ===== 利益確定シリーズ ===== */

/* ============ 109. 利確の3流派 ============ */
{
  let g = txt(320, 30, "利益確定の3つの流派 ― どれかが正解ではなく、手法との整合が正解", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += card(40, 58, 180, 140, "① 目標値で決める", "#2b4a8b", ["値幅観測・次の抵抗帯・", "R倍数などで事前に", "出口価格を決めておく", "→ 勝率型。取り逃しは", "　許容する"], { lineSize: 10.5 });
  g += card(230, 58, 180, 140, "② 追随して決める", "#1f6e50", ["トレーリングストップで", "転換の兆しまで持ち続ける", "→ 損益比型。大相場を", "　取り、勝率と", "　返上分を差し出す"], { lineSize: 10.5 });
  g += card(420, 58, 180, 140, "③ 時間で決める", "#a3690f", ["決めた期間が来たら", "決済する（イベント通過・", "保有期限）", "→ 検証しやすく", "　規律を保ちやすい"], { lineSize: 10.5 });
  g += txt(320, 232, "3流派は組み合わせ可能（例：半分を目標値で確定し、残りをトレーリング）", { anchor: "middle", size: 11.5, fill: SUB });
  save("profit-3schools", 640, 250, g);
}

/* ============ 110. 値幅観測（N計算） ============ */
{
  let g = txt(320, 26, "値幅観測の基本形（N計算：直前の上げ幅を押し目から投影）", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  const pts = [[60, 250], [140, 250 - 90], [200, 250 - 55], [300, 250 - 145]];
  g += poly([[60, 250], [140, 160]], { color: INK, w: 2.5 });
  g += poly([[140, 160], [200, 195]], { color: INK, w: 2.5 });
  g += poly([[200, 195], [320, 105]], { color: INK, w: 2.5 });
  // N: A→B の幅を C から投影
  g += arrow(80, 250, 80, 162, { color: UP, w: 2 });
  g += txt(90, 205, "上げ幅 N", { fill: UP, size: 12, bold: true });
  g += arrow(230, 195, 230, 107, { color: UP, w: 2 });
  g += txt(240, 150, "同じ幅 N を投影", { fill: UP, size: 12, bold: true });
  g += line(200, 105, 420, 105, { color: LV, w: 2, dash: "6 4" });
  g += txt(428, 109, "目標値の目安", { fill: LV, size: 12, bold: true });
  g += txt(115, 268, "A→B の上昇", { size: 11, anchor: "middle" });
  g += txt(200, 215, "C（押し目）", { size: 11 });
  g += txt(320, 300, "「前と同じ規模の波が出る」という仮定に基づく目安。保証ではなく、利確計画の土台となる基準点", { anchor: "middle", size: 11, fill: SUB });
  save("measured-move", 640, 315, g);
}

/* ============ 111. 抵抗帯を目標にする ============ */
{
  let g = txt(320, 26, "次の抵抗帯の「手前」を目標にする", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += line(60, 80, 580, 80, { color: DN, w: 2, dash: "6 4" });
  g += txt(66, 70, "過去の高値・戻り売りが待つ抵抗帯", { size: 11.5, fill: DN });
  const pts = [[60, 250], [130, 220], [190, 235], [260, 190], [330, 205], [400, 150], [470, 120]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += line(60, 100, 580, 100, { color: UP, w: 2 });
  g += txt(500, 118, "利確目標：抵抗帯の手前", { fill: UP, size: 12, bold: true });
  g += `<circle cx="130" cy="220" r="7" fill="none" stroke="${UP}" stroke-width="2"/>`;
  g += txt(142, 224, "買い", { fill: UP, size: 11.5 });
  g += txt(320, 292, "「みんなが売りたい場所」まで引っ張らず、その手前で先に降りる。欲との交換で約定確率を買う設計", { anchor: "middle", size: 11, fill: SUB });
  save("target-resistance", 640, 305, g);
}

/* ============ 112. R倍数で目標を決める ============ */
{
  let g = txt(320, 26, "R倍数による目標設定：損切り距離を利益の物差しにする", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += `<rect x="120" y="196" width="400" height="44" rx="4" fill="${DN}" opacity="0.14"/>`;
  g += txt(320, 222, "1R ＝ エントリーから損切りまでの距離（許容損失）", { anchor: "middle", fill: DN, bold: true, size: 12 });
  [[152, "＋1R", 0.35], [108, "＋2R", 0.5], [64, "＋3R", 0.65]].forEach(([y, t, op]) => {
    g += `<rect x="120" y="${y}" width="400" height="40" rx="4" fill="${UP}" opacity="${op}"/>`;
    g += txt(320, y + 25, `${t} ${t === "＋2R" ? "= 必要勝率33%の分岐点" : ""}`, { anchor: "middle", fill: "#fff", bold: true, size: 12 });
  });
  g += line(120, 192, 520, 192, { color: INK, w: 2 });
  g += txt(110, 196, "買値", { anchor: "end", size: 11.5, fill: INK, bold: true });
  g += txt(320, 275, "目標を2R以上に置けるエントリーだけを選ぶ、という「取引の入口の選別基準」としても機能する", { anchor: "middle", size: 11, fill: SUB });
  save("r-multiple-target", 640, 290, g);
}

/* ============ 113. 分割利確の3型 ============ */
{
  let g = txt(320, 28, "分割利確の代表的な3つの型", { anchor: "middle", bold: true, fill: INK, size: 13.5 });
  g += card(40, 55, 180, 145, "半分＋トレール型", "#2b4a8b", ["目標到達で半分を確定し", "残り半分をトレーリング", "", "「確実さ」と「大相場」の", "両取りを狙う最多数派"], { lineSize: 10.5 });
  g += card(230, 55, 180, 145, "3分割型", "#1f6e50", ["+1R/+2R/+3Rなど", "段階ごとに1/3ずつ確定", "", "損益曲線が滑らかになり", "心理的に続けやすい"], { lineSize: 10.5 });
  g += card(420, 55, 180, 145, "建値ストップ型", "#a3690f", ["最初の利確後、残りの", "損切りを建値に引き上げ", "", "「負けない状態」を作って", "から利益を追う"], { lineSize: 10.5 });
  g += txt(320, 232, "共通の代償：一括で最良の出口を当てた場合より総利益は減る。買っているのは「結果のブレの小ささ」", { anchor: "middle", size: 11, fill: SUB });
  save("partial-exit", 640, 250, g);
}

/* ============ 114. 利確後の再上昇問題 ============ */
{
  let g = txt(320, 26, "「売った後に上がる」は正常。問題は感情での買い直し", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  const pts = [[50, 240], [120, 200], [180, 215], [250, 160], [310, 175], [370, 120], [430, 135], [500, 80], [570, 60]];
  g += poly(pts, { color: INK, w: 2.5 });
  g += `<circle cx="370" cy="120" r="8" fill="none" stroke="${UP}" stroke-width="2.2"/>`;
  g += txt(360, 103, "計画通り利確", { fill: UP, size: 12, bold: true, anchor: "end" });
  g += `<circle cx="500" cy="80" r="8" fill="none" stroke="${DN}" stroke-width="2.2"/>`;
  g += txt(512, 76, "悔しさで飛び乗り直すと", { fill: DN, size: 11.5 });
  g += txt(512, 93, "高値掴みの入口に", { fill: DN, size: 11.5 });
  g += txt(320, 280, "再エントリーは「悔しさ」ではなく「新規の買い条件を再び満たしたか」で判定する（押し目・ブレイク等）", { anchor: "middle", size: 11, fill: SUB });
  save("reentry-problem", 640, 295, g);
}

/* ============ 115. 利小損大の矯正 ============ */
{
  let g = txt(320, 26, "損益分布の「形」を変える ― 利小損大から損小利大へ", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  // Before: 左に長い裾
  g += txt(165, 55, "矯正前：利益は早取り・損失は放置", { anchor: "middle", size: 11.5, fill: DN, bold: true });
  [[60, 30, DN], [90, 55, DN], [120, 20, UP], [150, 70, UP], [180, 60, UP], [210, 25, UP]].forEach(([x, h, c], i) => {
    g += `<rect x="${x}" y="${200 - h}" width="24" height="${h}" fill="${c}" opacity="0.75"/>`;
  });
  g += txt(75, 215, "大きな損失の裾", { size: 10, fill: DN });
  g += txt(180, 215, "小さな利益の山", { size: 10, fill: SUB });
  // After: 右に裾
  const dx = 340;
  g += txt(dx + 130, 55, "矯正後：損失は−1Rで揃い、利益に裾", { anchor: "middle", size: 11.5, fill: UP, bold: true });
  [[dx, 45, DN], [dx + 30, 48, DN], [dx + 60, 46, DN], [dx + 90, 55, UP], [dx + 120, 40, UP], [dx + 150, 28, UP], [dx + 180, 18, UP], [dx + 210, 10, UP]].forEach(([x, h, c]) => {
    g += `<rect x="${x}" y="${200 - h}" width="24" height="${h}" fill="${c}" opacity="0.75"/>`;
  });
  g += txt(dx + 45, 215, "損失は一定幅で整列", { size: 10, fill: SUB });
  g += txt(dx + 190, 215, "大きな利益の裾", { size: 10, fill: UP });
  g += line(320, 45, 320, 220, { color: GRID, w: 1 });
  g += txt(320, 255, "利確ルールの目的は「毎回勝つ」ことではなく、損益分布の右側に裾（大きな利益）を残すこと", { anchor: "middle", size: 11, fill: SUB });
  save("pl-distribution", 640, 270, g);
}

/* ============ 116. リバランス ============ */
{
  let g = txt(320, 26, "リバランス：配分の復元が「高く売って安く買う」を自動化する", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  const bar = (x, label, stock, bond, note) => {
    let s = "";
    const H = 140, y0 = 70;
    const hs = H * stock / 100, hb = H * bond / 100;
    s += `<rect x="${x}" y="${y0 + H - hs - hb}" width="90" height="${hb}" fill="#1f6e50" opacity="0.8"/>`;
    s += `<rect x="${x}" y="${y0 + H - hs}" width="90" height="${hs}" fill="#2b4a8b" opacity="0.9"/>`;
    s += txt(x + 45, y0 + H + 22, label, { anchor: "middle", size: 11.5, bold: true });
    s += txt(x + 45, y0 + H + 40, note, { anchor: "middle", size: 10 });
    return s;
  };
  g += bar(70, "目標配分", 60, 40, "株60：債40");
  g += arrow(180, 140, 220, 140, { color: SUB, w: 2 });
  g += bar(230, "株高で膨張", 72, 28, "株72：債28に");
  g += arrow(340, 140, 380, 140, { color: SUB, w: 2 });
  g += bar(390, "リバランス", 60, 40, "株を売り債券を買い60:40へ");
  g += txt(540, 120, "─ 株式", { fill: "#2b4a8b", size: 11.5 });
  g += txt(540, 140, "─ 債券", { fill: "#1f6e50", size: 11.5 });
  g += txt(320, 268, "「上がった資産を売る」判断が感情抜きで発生する＝長期投資における仕組み化された利益確定", { anchor: "middle", size: 11, fill: SUB });
  save("rebalance", 640, 285, g);
}

/* ============ 117. 利確と税金 ============ */
{
  let g = txt(320, 28, "利益確定と税金：口座で手取りが変わる（概要）", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 課税口座
  g += `<rect x="80" y="60" width="200" height="150" rx="8" fill="#ffffff" stroke="${DN}" stroke-width="2"/>`;
  g += txt(180, 85, "課税口座（特定口座等）", { anchor: "middle", fill: DN, bold: true, size: 12.5 });
  g += `<rect x="110" y="100" width="140" height="60" fill="${UP}" opacity="0.7"/>`;
  g += `<rect x="110" y="100" width="140" height="13" fill="${DN}"/>`;
  g += txt(180, 180, "利益100万円 → 税 約20.3万円", { anchor: "middle", size: 11 });
  g += txt(180, 197, "手取り 約79.7万円", { anchor: "middle", size: 11.5, bold: true });
  // NISA
  g += `<rect x="360" y="60" width="200" height="150" rx="8" fill="#ffffff" stroke="#1d7a3e" stroke-width="2"/>`;
  g += txt(460, 85, "NISA口座", { anchor: "middle", fill: "#1d7a3e", bold: true, size: 12.5 });
  g += `<rect x="390" y="100" width="140" height="60" fill="${UP}" opacity="0.7"/>`;
  g += txt(460, 180, "利益100万円 → 税 0円", { anchor: "middle", size: 11 });
  g += txt(460, 197, "手取り 100万円", { anchor: "middle", size: 11.5, bold: true });
  g += txt(320, 245, "課税口座の「利確」は税コストを伴う＝頻繁な乗り換えは税の複利を失う。口座と出口設計はセットで考える", { anchor: "middle", size: 10.5, fill: SUB });
  save("tax-profit", 640, 260, g);
}

/* ============ 118. 利確の格言マップ ============ */
{
  let g = txt(320, 26, "利益確定にまつわる格言と、その警告対象", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += card(45, 55, 260, 100, "「利食い千人力」", "#1f6e50", ["確定した利益だけが本物の力。", "含み益への慢心と、", "利確をためらう欲への戒め"], { lineSize: 10.5 });
  g += card(335, 55, 260, 100, "「頭と尻尾はくれてやれ」", "#2b4a8b", ["天井で売ろうとするな。", "最高値への未練が", "往復（利益消滅）を招く"], { lineSize: 10.5 });
  g += card(45, 170, 260, 100, "「二度に買うべし二度に売るべし」", "#a3690f", ["一度に全部売買しない。", "分割による平均化の勧め", "（分割利確の古典的表現）"], { lineSize: 10.5, titleSize: 11.5 });
  g += card(335, 170, 260, 100, "「売りは早かれ買いは遅かれ」", "#6b4fa0", ["出口は素早く、入口は慎重に。", "逃げ足の速さを", "美徳とする相場観"], { lineSize: 10.5 });
  save("profit-proverbs", 640, 290, g);
}

/* ============ 119. スキャルピング ============ */
{
  let g = txt(320, 26, "スキャルピング：極小の値幅を高頻度で積み上げる", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 1分足イメージ：細かい波を高頻度で出入り
  const wave = [[60, 170], [95, 150], [125, 160], [160, 135], [190, 148], [225, 120], [255, 133], [290, 110], [320, 125], [355, 100], [385, 115], [420, 95]];
  g += poly(wave, { color: INK, w: 2 });
  g += arrow(95, 190, 95, 155, { color: UP, w: 2 });
  g += txt(95, 205, "入", { anchor: "middle", size: 10.5, fill: UP });
  g += arrow(160, 100, 160, 130, { color: DN, w: 2 });
  g += txt(160, 92, "出", { anchor: "middle", size: 10.5, fill: DN });
  g += arrow(225, 155, 225, 125, { color: UP, w: 2 });
  g += txt(225, 170, "入", { anchor: "middle", size: 10.5, fill: UP });
  g += arrow(290, 75, 290, 105, { color: DN, w: 2 });
  g += txt(290, 67, "出", { anchor: "middle", size: 10.5, fill: DN });
  g += txt(240, 235, "保有時間：数秒〜数分 ／ 1回の狙い幅：ごく小さい ／ 取引回数：多い", { anchor: "middle", size: 11, fill: SUB });
  // 右側：コストの壁
  g += `<rect x="450" y="60" width="160" height="150" rx="8" fill="#ffffff" stroke="${LV}" stroke-width="2"/>`;
  g += txt(530, 84, "コストの壁", { anchor: "middle", fill: LV, bold: true, size: 12 });
  g += txt(462, 108, "狙う値幅が小さいほど", { size: 10.5 });
  g += txt(462, 126, "スプレッド・手数料の", { size: 10.5 });
  g += txt(462, 144, "比率が大きくなる", { size: 10.5 });
  g += txt(462, 172, "例：狙い幅の2割が", { size: 10.5, fill: INK });
  g += txt(462, 190, "コストなら期待値は激減", { size: 10.5, fill: INK });
  g += txt(320, 262, "利益の源泉が小さいぶん、執行コストと約定品質が成否を直接左右する", { anchor: "middle", size: 11, fill: SUB });
  save("scalping-basics", 640, 280, g);
}

/* ============ 120. デイトレード ============ */
{
  let g = txt(320, 26, "デイトレード：その日のうちに完結させ、翌日に持ち越さない", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 1日の値動きと寄り・引け
  g += line(70, 60, 70, 210, { color: GRID, w: 1.5 });
  g += line(430, 60, 430, 210, { color: GRID, w: 1.5 });
  g += txt(70, 232, "寄付き", { anchor: "middle", size: 11, bold: true });
  g += txt(430, 232, "大引け", { anchor: "middle", size: 11, bold: true });
  g += poly([[70, 160], [110, 140], [150, 155], [200, 115], [250, 130], [300, 100], [350, 118], [430, 95]], { color: INK, w: 2.2 });
  g += arrow(150, 190, 150, 160, { color: UP, w: 2.2 });
  g += txt(150, 205, "仕掛け", { anchor: "middle", size: 10.5, fill: UP });
  g += arrow(350, 85, 350, 112, { color: DN, w: 2.2 });
  g += txt(350, 76, "手仕舞い", { anchor: "middle", size: 10.5, fill: DN });
  // オーバーナイト遮断
  g += `<rect x="450" y="70" width="160" height="130" rx="8" fill="#ffffff" stroke="${DN}" stroke-width="2"/>`;
  g += txt(530, 94, "持ち越さない理由", { anchor: "middle", fill: DN, bold: true, size: 12 });
  g += txt(462, 118, "夜間・海外市場の急変や", { size: 10.5 });
  g += txt(462, 136, "決算・要人発言による", { size: 10.5 });
  g += txt(462, 154, "翌朝の窓開けリスクを", { size: 10.5 });
  g += txt(462, 172, "構造的に遮断する", { size: 10.5, fill: INK });
  g += txt(320, 262, "保有時間：数分〜数時間 ／ 判断材料：当日の値動き・出来高・板 ／ 損益は毎日確定する", { anchor: "middle", size: 11, fill: SUB });
  save("daytrading-basics", 640, 280, g);
}

/* ============ 121. スイングトレード ============ */
{
  let g = txt(320, 26, "スイングトレード：数日〜数週間の「波のひと振り」を取りにいく", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 大きな上昇トレンドの中の押し目〜戻り
  g += poly([[60, 200], [110, 170], [140, 185], [200, 140], [235, 158], [300, 110], [335, 130], [400, 85], [440, 100], [500, 60]], { color: INK, w: 2.2 });
  g += arrow(140, 215, 140, 190, { color: UP, w: 2.5 });
  g += txt(140, 230, "押し目で仕掛け", { anchor: "middle", size: 10.5, fill: UP });
  g += arrow(300, 80, 300, 105, { color: DN, w: 2.5 });
  g += txt(300, 71, "波の終わりで手仕舞い", { anchor: "middle", size: 10.5, fill: DN });
  g += line(60, 245, 500, 245, { color: GRID, w: 1 });
  g += txt(280, 264, "1回の波：数日〜数週間 ／ 日をまたいで保有する＝夜間のリスクも引き受ける", { anchor: "middle", size: 11, fill: SUB });
  g += txt(555, 150, "日足・週足が主戦場。", { anchor: "middle", size: 10.5, fill: SUB });
  g += txt(555, 168, "画面に張り付かず", { anchor: "middle", size: 10.5, fill: SUB });
  g += txt(555, 186, "夜の分析で完結しやすい", { anchor: "middle", size: 10.5, fill: SUB });
  save("swing-trading", 640, 285, g);
}

/* ============ 122. 時間軸の選び方 ============ */
{
  let g = txt(320, 26, "トレードスタイル比較：時間軸が変わると「別の競技」になる", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const col = (x, title, color, lines) => {
    let s = `<rect x="${x}" y="52" width="136" height="185" rx="8" fill="#ffffff" stroke="${color}" stroke-width="2"/>`;
    s += txt(x + 68, 76, title, { anchor: "middle", fill: color, bold: true, size: 12 });
    lines.forEach((l, i) => { s += txt(x + 10, 100 + i * 19, l, { size: 10 }); });
    return s;
  };
  g += col(38, "スキャルピング", UP, ["保有：数秒〜数分", "足：1分・ティック", "回数：1日数十回", "生命線：執行コスト", "拘束：張り付き必須", "口座資金の回転：極大"]);
  g += col(188, "デイトレード", "#a3690f", ["保有：数分〜数時間", "足：1分〜15分＋日足", "回数：1日数回", "生命線：当日の規律", "拘束：市場時間中", "持ち越しリスク：なし"]);
  g += col(338, "スイング", "#1f6e50", ["保有：数日〜数週間", "足：1時間〜週足", "回数：月数回", "生命線：損切り位置", "拘束：小さい", "持ち越しリスク：あり"]);
  g += col(488, "長期投資", DN, ["保有：数年〜", "足：週足・月足", "回数：年数回", "生命線：配分と継続", "拘束：ごく小さい", "源泉：成長・複利"]);
  g += txt(320, 262, "右へ行くほど時間の拘束と取引コストは減り、1回の判断の重みと忍耐の比重が増える", { anchor: "middle", size: 11, fill: SUB });
  save("timeframe-styles", 640, 280, g);
}

/* ============ 123. マルチタイムフレーム ============ */
{
  let g = txt(320, 26, "マルチタイムフレーム分析：上位足で環境認識、下位足でタイミング", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  const panel = (x, label, pts, note, color) => {
    let s = `<rect x="${x}" y="52" width="170" height="150" rx="8" fill="#ffffff" stroke="${GRID}" stroke-width="1.5"/>`;
    s += txt(x + 85, 72, label, { anchor: "middle", bold: true, fill: color, size: 12 });
    s += poly(pts.map(([px, py]) => [x + px, 82 + py]), { color: INK, w: 2 });
    s += txt(x + 85, 220, note, { anchor: "middle", size: 10.5 });
    return s;
  };
  g += panel(35, "月足・週足（森）", [[15, 95], [45, 70], [70, 82], [100, 50], [125, 62], [155, 30]], "大きな流れ＝上昇", DN);
  g += arrow(215, 125, 245, 125, { color: SUB, w: 2.5 });
  g += panel(255, "日足（木）", [[15, 40], [40, 70], [60, 55], [85, 90], [110, 75], [130, 95], [155, 60]], "流れの中の押し目", "#1f6e50");
  g += arrow(435, 125, 465, 125, { color: SUB, w: 2.5 });
  g += panel(475 - 30, "1時間足（枝）", [[15, 95], [40, 85], [60, 92], [85, 70], [110, 78], [130, 55], [155, 45]], "反転の兆しで仕掛け", UP);
  g += txt(320, 258, "時間足ごとに見える景色は違う。上位足の方向と下位足のタイミングを一致させるのが基本形", { anchor: "middle", size: 11, fill: SUB });
  save("multi-timeframe", 640, 275, g);
}

/* ============ 124. インジケーター組み合わせ ============ */
{
  let g = txt(320, 26, "インジケーターの組み合わせ：役割の違うものを重ねる", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += card(40, 55, 270, 105, "トレンド系（方向を測る）", DN, ["移動平均線・MACD・一目均衡表", "「今どちらに流れているか」", "レンジ相場ではダマシが増える"], { lineSize: 10.5 });
  g += card(330, 55, 270, 105, "オシレーター系（過熱を測る）", UP, ["RSI・ストキャスティクス", "「行き過ぎていないか」", "強いトレンドでは張り付く"], { lineSize: 10.5 });
  g += arrow(175, 170, 285, 205, { color: SUB, w: 2 });
  g += arrow(465, 170, 355, 205, { color: SUB, w: 2 });
  g += `<rect x="200" y="200" width="240" height="60" rx="8" fill="#ffffff" stroke="#1f6e50" stroke-width="2"/>`;
  g += txt(320, 224, "弱点を補い合う組み合わせ", { anchor: "middle", fill: "#1f6e50", bold: true, size: 12 });
  g += txt(320, 245, "例：トレンド系で方向、オシレーターで入り時", { anchor: "middle", size: 10.5 });
  g += txt(320, 284, "同じ系統を複数並べても情報は増えない（多重共線）。「方向×過熱×出来高」のように役割で分ける", { anchor: "middle", size: 10.5, fill: SUB });
  save("indicator-combination", 640, 300, g);
}

/* ============ 125. さや取り（ペアトレード） ============ */
{
  let g = txt(320, 26, "さや取り（ペアトレード）：2つの値動きの「差」だけを取る", { anchor: "middle", bold: true, fill: INK, size: 13 });
  // 2本の連動する線とサヤの開閉
  g += poly([[60, 150], [120, 130], [180, 140], [240, 110], [300, 95], [360, 115], [420, 100], [480, 108]], { color: DN, w: 2.2 });
  g += poly([[60, 165], [120, 148], [180, 160], [240, 145], [300, 150], [360, 132], [420, 118], [480, 122]], { color: "#1f6e50", w: 2.2 });
  g += txt(500, 105, "銘柄A", { fill: DN, size: 11, bold: true });
  g += txt(500, 128, "銘柄B", { fill: "#1f6e50", size: 11, bold: true });
  // サヤ拡大部分
  g += line(300, 95, 300, 150, { color: LV, w: 2, dash: "4 3" });
  g += txt(300, 175, "サヤ拡大", { anchor: "middle", size: 10.5, fill: LV, bold: true });
  g += txt(300, 192, "割高Aを売り・割安Bを買い", { anchor: "middle", size: 10 });
  g += line(480, 108, 480, 122, { color: LV, w: 2, dash: "4 3" });
  g += txt(462, 145, "サヤ収縮で両建て解消", { anchor: "middle", size: 10 });
  g += txt(320, 235, "市場全体が上がっても下がっても、2つの「差」が縮めば利益になる＝相場の方向に賭けない", { anchor: "middle", size: 11, fill: SUB });
  g += txt(320, 256, "前提は「AとBは長期的に連動する」という関係の持続。関係が壊れると両側で損失もありうる", { anchor: "middle", size: 10.5, fill: UP });
  save("pair-trading", 640, 275, g);
}

/* ============ 126. アービトラージ ============ */
{
  let g = txt(320, 26, "アービトラージ：同じ価値のものが違う値段で売られている瞬間を突く", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  g += `<rect x="60" y="60" width="200" height="90" rx="8" fill="#ffffff" stroke="${DN}" stroke-width="2"/>`;
  g += txt(160, 88, "市場X", { anchor: "middle", fill: DN, bold: true, size: 12.5 });
  g += txt(160, 115, "同一資産：100.0", { anchor: "middle", size: 12 });
  g += txt(160, 136, "→ ここで買う", { anchor: "middle", size: 11, fill: UP, bold: true });
  g += `<rect x="380" y="60" width="200" height="90" rx="8" fill="#ffffff" stroke="#1f6e50" stroke-width="2"/>`;
  g += txt(480, 88, "市場Y", { anchor: "middle", fill: "#1f6e50", bold: true, size: 12.5 });
  g += txt(480, 115, "同一資産：100.4", { anchor: "middle", size: 12 });
  g += txt(480, 136, "→ ここで売る", { anchor: "middle", size: 11, fill: DN, bold: true });
  g += arrow(270, 105, 370, 105, { color: LV, w: 2.5 });
  g += txt(320, 95, "差0.4が理論上の利益", { anchor: "middle", size: 10.5, fill: LV });
  g += txt(320, 185, "ただし価格差は皆が狙うため一瞬で消える。コスト（手数料・送金・時間）を引いた残りが実際の利益", { anchor: "middle", size: 11, fill: SUB });
  g += txt(320, 207, "「無リスク」と呼ばれるのは教科書の中だけ。執行・カウンターパーティ・規制のリスクは常に残る", { anchor: "middle", size: 10.5, fill: UP });
  save("arbitrage", 640, 225, g);
}

/* ============ 127. ローソク足の種類図鑑 ============ */
{
  let g = txt(320, 24, "ローソク足の基本形：実体とヒゲの比率が「勢いと迷い」を語る", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  const item = (cx, name, note, drawFn) => {
    let s = drawFn(cx);
    s += txt(cx, 200, name, { anchor: "middle", size: 11, bold: true, fill: INK });
    s += txt(cx, 218, note, { anchor: "middle", size: 9.5 });
    return s;
  };
  g += item(75, "大陽線", "強い買い優勢", (cx) => candle(cx, 55, 170, 60, 175, { w: 18 }));
  g += item(165, "大陰線", "強い売り優勢", (cx) => candle(cx, 55, 60, 170, 175, { w: 18 }));
  g += item(255, "小陽線（コマ）", "小幅の攻防", (cx) => candle(cx, 90, 130, 105, 150, { w: 14 }));
  g += item(345, "十字線（同事線）", "売買の拮抗・迷い", (cx) => candle(cx, 70, 118, 116, 165, { w: 14 }));
  g += item(435, "トンボ", "下ヒゲ長・下値で買い", (cx) => candle(cx, 75, 75, 78, 170, { w: 14 }));
  g += item(525, "トウバ", "上ヒゲ長・上値で売り", (cx) => candle(cx, 70, 165, 168, 170, { w: 14 }));
  g += txt(320, 250, "実体が長い＝一方の勢いが強い ／ ヒゲが長い＝その方向への試みが押し返された跡", { anchor: "middle", size: 11, fill: SUB });
  save("candlestick-types", 640, 265, g);
}

/* ============ 128. 酒田五法 ============ */
{
  let g = txt(320, 24, "酒田五法：三山・三川・三空・三兵・三法", { anchor: "middle", bold: true, fill: INK, size: 13 });
  const panel = (x, y, w, h, title, color) => {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#ffffff" stroke="${color}" stroke-width="1.8"/>`;
    s += txt(x + w / 2, y + 18, title, { anchor: "middle", fill: color, bold: true, size: 11.5 });
    return s;
  };
  // 三山（天井）
  g += panel(35, 42, 180, 110, "三山（さんざん）＝天井", UP);
  g += poly([[50, 135], [70, 90], [90, 120], [110, 82], [130, 120], [150, 92], [175, 138]].map(p => [p[0] + 5, p[1]]), { color: INK, w: 2 });
  g += txt(125, 146, "三度高値に挑み失敗", { anchor: "middle", size: 9.5 });
  // 三川（底）
  g += panel(230, 42, 180, 110, "三川（さんせん）＝底", DN);
  g += poly([[245, 60], [265, 110], [285, 80], [305, 118], [325, 82], [345, 108], [368, 55]], { color: INK, w: 2 });
  g += txt(320, 146, "三度安値を試して反発", { anchor: "middle", size: 9.5 });
  // 三空
  g += panel(425, 42, 180, 110, "三空（さんくう）＝過熱", LV);
  let sx = 455, sy = 130;
  for (let i = 0; i < 4; i++) { g += candle(sx + i * 28, sy - i * 22 - 26, sy - i * 22 - 4, sy - i * 22 - 24, sy - i * 22, { w: 12 }); }
  g += txt(515, 146, "窓3つの連騰＝反動警戒", { anchor: "middle", size: 9.5 });
  // 三兵
  g += panel(120, 168, 180, 105, "三兵（さんぺい）＝勢いの継続", "#1f6e50");
  for (let i = 0; i < 3; i++) { g += candle(165 + i * 30, 250 - i * 18 - 42, 250 - i * 18 - 8, 250 - i * 18 - 38, 250 - i * 18, { w: 13 }); }
  g += txt(210, 264, "陽線（陰線）3本の連続", { anchor: "middle", size: 9.5 });
  // 三法
  g += panel(340, 168, 180, 105, "三法（さんぽう）＝休みも相場", "#6b4fa0");
  g += candle(365, 190, 195, 235, 240, { w: 13 });
  g += candle(392, 205, 210, 222, 228, { w: 9 });
  g += candle(412, 208, 214, 226, 232, { w: 9 });
  g += candle(432, 202, 208, 220, 226, { w: 9 });
  g += candle(462, 185, 230, 190, 236, { w: 13 });
  g += txt(430, 264, "大きな足→小休止→再放れ", { anchor: "middle", size: 9.5 });
  save("sakata-gohou", 640, 290, g);
}

/* ============ 129. だまし（フェイクブレイク） ============ */
{
  let g = txt(320, 26, "だまし：ブレイクに見せかけて、すぐ元のレンジへ戻る", { anchor: "middle", bold: true, fill: INK, size: 13 });
  g += line(60, 110, 560, 110, { color: LV, w: 2, dash: "6 4" });
  g += txt(575, 114, "抵抗線", { size: 10.5, fill: LV });
  // レンジ内の動き→上抜け→急反落
  g += poly([[70, 180], [110, 140], [150, 170], [190, 130], [230, 165], [270, 125], [310, 150], [350, 88], [380, 100], [410, 160], [450, 200], [500, 230]], { color: INK, w: 2.2 });
  g += arrow(350, 60, 350, 82, { color: UP, w: 2.2 });
  g += txt(350, 52, "「ブレイクだ」と買いが乗る", { anchor: "middle", size: 10.5, fill: UP });
  g += arrow(430, 140, 450, 190, { color: DN, w: 2.2 });
  g += txt(485, 150, "すぐ線の内側へ逆戻り", { anchor: "middle", size: 10.5, fill: DN });
  g += txt(490, 168, "＝乗った買いが損失に", { anchor: "middle", size: 10.5, fill: DN });
  g += txt(320, 262, "終値での確定・出来高の裏付け・値幅フィルターなど、「本物の放れ」と区別する工夫が対抗策になる", { anchor: "middle", size: 10.5, fill: SUB });
  save("false-breakout", 640, 280, g);
}

/* ============ 130. セリングクライマックス／バイイングクライマックス ============ */
{
  let g = txt(320, 24, "セリングクライマックス：投げ売りの集中が「売り手の枯渇」を作る", { anchor: "middle", bold: true, fill: INK, size: 12.5 });
  // 価格：急落→出来高急増の大陰線→反発
  g += poly([[60, 70], [110, 90], [150, 85], [200, 115], [250, 130], [290, 160], [320, 200], [345, 230], [370, 215], [410, 185], [460, 170], [510, 150]], { color: INK, w: 2.2 });
  // 出来高バー
  const vols = [[60, 12], [110, 15], [150, 13], [200, 20], [250, 24], [290, 32], [320, 45], [345, 68], [370, 40], [410, 26], [460, 20], [510, 16]];
  for (const [x, h] of vols) { g += `<rect x="${x - 8}" y="${300 - h}" width="16" height="${h}" fill="${x === 345 ? UP : "#9fb0c4"}"/>`; }
  g += txt(345, 310 - 90, "", { size: 1 });
  g += line(40, 300, 600, 300, { color: GRID, w: 1 });
  g += txt(52, 314, "出来高", { size: 10, fill: SUB });
  g += arrow(345, 260, 345, 236, { color: UP, w: 2 });
  g += txt(345, 274 - 100, "", { size: 1 });
  g += txt(400, 250, "出来高急増＋長い下ヒゲ", { size: 10.5, fill: UP, bold: true });
  g += txt(400, 266, "＝投げたい人が投げ尽くした可能性", { size: 10 });
  g += txt(320, 336, "買いの熱狂が集中して天井を作る逆パターンがバイイングクライマックス。どちらも「事後にしか確定しない」", { anchor: "middle", size: 10.5, fill: SUB });
  save("selling-climax", 640, 350, g);
}

console.log("done");
