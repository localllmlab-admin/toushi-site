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

console.log("done");
