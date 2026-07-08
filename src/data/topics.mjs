/**
 * テーマ別カテゴリ（/topics/）の単一定義。
 * - 分類は frontmatter の実データ（chapter / kind / patternType / tags）のみから決める。
 *   根拠のない「人気」「おすすめ」分類は作らない（docs/tone.md の信頼原則と同一）。
 * - 1記事が複数テーマに属してよい（読者の入口を増やすための横断分類）。
 * - 用語集はリファレンスとして独立させ、テーマ一覧には混ぜない。
 */

const hasTag = (data, ...keys) => (data.tags ?? []).some((t) => keys.includes(t));

export const TOPICS = [
  {
    slug: "indicators",
    title: "テクニカル指標",
    lead: "移動平均・RSI・MACDからDMI・CCIまで。指標の仕組みと限界を1本ずつ図解で学ぶ。",
    thumb: "指標",
    grad: "linear-gradient(135deg,#a3690f,#c98f35)",
    match: (col, d) => col === "charts" && d.patternType === "インジケーター",
  },
  {
    slug: "chart-patterns",
    title: "チャートパターン",
    lead: "ダブルトップ・三角保ち合い・アイランドリバーサル。反転と継続の型を図解で覚える。",
    thumb: "型",
    grad: "linear-gradient(135deg,#a3690f,#c98f35)",
    match: (col, d) => col === "charts" && (d.patternType === "反転" || d.patternType === "継続"),
  },
  {
    slug: "candlestick",
    title: "ローソク足・プライスアクション",
    lead: "1本のローソク足から酒田五法・平均足まで。値動きそのものを読む技術。",
    thumb: "足",
    grad: "linear-gradient(135deg,#a3690f,#c98f35)",
    match: (col, d) =>
      (col === "charts" && d.patternType === "プライスアクション") ||
      (col === "learn" && hasTag(d, "ローソク足")),
  },
  {
    slug: "risk-management",
    title: "損切り・利確・資金管理",
    lead: "退場しないための技術。損切りの設計、利益確定の型、ポジションサイズの決め方。",
    thumb: "守",
    grad: "linear-gradient(135deg,#1f6e50,#37936f)",
    match: (col, d) =>
      (col === "playbook" && d.kind === "リスク管理") ||
      (col === "learn" && d.chapter === "リスク管理") ||
      hasTag(d, "損切り", "利益確定", "資金管理"),
  },
  {
    slug: "strategy",
    title: "売買手法・定石",
    lead: "順張り・逆張り・ブレイクアウト。前提条件と検証の考え方つきで手法を学ぶ。",
    thumb: "技",
    grad: "linear-gradient(135deg,#1f6e50,#37936f)",
    match: (col, d) => col === "playbook" && (d.kind === "手法" || d.kind === "定石"),
  },
  {
    slug: "proverbs",
    title: "相場格言",
    lead: "「頭と尻尾はくれてやれ」「人の行く裏に道あり」。先人の知恵を数理で読み直す。",
    thumb: "言",
    grad: "linear-gradient(135deg,#1f6e50,#37936f)",
    match: (col, d) => col === "playbook" && d.kind === "格言",
  },
  {
    slug: "market-basics",
    title: "市場と経済の仕組み",
    lead: "金利・インフレ・中央銀行・市場参加者。相場の土台になる経済の仕組み。",
    thumb: "礎",
    grad: "linear-gradient(135deg,#2b4a8b,#4a6cb0)",
    match: (col, d) => col === "learn" && d.chapter === "お金と市場の基礎",
  },
  {
    slug: "products",
    title: "投資商品と制度",
    lead: "NISA・iDeCo・投資信託・ETF・先物オプション。商品と制度の仕組みと注意点。",
    thumb: "制",
    grad: "linear-gradient(135deg,#2b4a8b,#4a6cb0)",
    match: (col, d) => col === "learn" && d.chapter === "商品と制度",
  },
  {
    slug: "analysis",
    title: "分析手法・相場理論",
    lead: "ダウ理論からサイクル分析・市場間分析まで。相場を読む枠組みを体系的に。",
    thumb: "析",
    grad: "linear-gradient(135deg,#2b4a8b,#4a6cb0)",
    match: (col, d) => col === "learn" && d.chapter === "分析手法",
  },
  {
    slug: "psychology",
    title: "相場心理・行動ファイナンス",
    lead: "プロスペクト理論・FOMO・群集心理。損をさせる「自分の脳」を知る。",
    thumb: "心",
    grad: "linear-gradient(135deg,#2b4a8b,#4a6cb0)",
    match: (col, d) =>
      (col === "learn" && d.chapter === "行動と心理") ||
      (col === "playbook" && d.kind === "心理") ||
      hasTag(d, "心理", "行動経済学"),
  },
  {
    slug: "bubble-history",
    title: "バブルと暴落の歴史",
    lead: "チューリップから平成バブル・リーマンまで。繰り返す熱狂と崩壊の構造。",
    thumb: "史",
    grad: "linear-gradient(135deg,#2b4a8b,#4a6cb0)",
    match: (col, d) => hasTag(d, "バブル", "歴史"),
  },
  {
    slug: "fx",
    title: "為替・FX",
    lead: "円安円高の仕組み・仲値・為替介入。為替市場の構造とFXの基礎知識。",
    thumb: "為",
    grad: "linear-gradient(135deg,#2b4a8b,#4a6cb0)",
    match: (col, d) => hasTag(d, "為替", "FX", "為替介入"),
  },
  {
    slug: "rules-tech",
    title: "ルール・自動売買",
    lead: "金商法などの法規制と、アルゴ取引・bot・AIの実際。市場の「決まりごと」と最前線。",
    thumb: "律",
    grad: "linear-gradient(135deg,#2b4a8b,#4a6cb0)",
    match: (col, d) =>
      col === "learn" && (d.chapter === "法規制とルール" || d.chapter === "テクノロジーと自動化"),
  },
];

/** 記事が属するテーマ一覧（glossaryは対象外） */
export const topicsOf = (collection, data) =>
  collection === "glossary" ? [] : TOPICS.filter((t) => t.match(collection, data));

/** 全コレクションのエントリー配列 [{collection, entry}] からテーマ別の件数・記事を集める */
export const collectTopics = (all) =>
  TOPICS.map((t) => ({
    ...t,
    items: all
      .filter(({ collection, entry }) => collection !== "glossary" && t.match(collection, entry.data))
      .sort((a, b) => new Date(b.entry.data.updated) - new Date(a.entry.data.updated)),
  }));
