/**
 * コレクション内の「読む順序」を1か所で定義する。
 *
 * 目的:
 * - 記事末尾の前後ナビ（前の記事／次の記事）を機械描画するための順序を与える。
 * - 一覧ページの並びと必ず一致させる（一覧では2番目なのに前後ナビでは5番目、という
 *   食い違いを防ぐため、並びの定義はこのファイルだけに置く）。
 *
 * 設計:
 * - グループ（章・種別・カテゴリ）の順に連結した1本の列にする。
 *   学習マップは「上から順に読む」前提なので、章をまたいでも列は途切れさせない。
 * - 表示中の記事がどのグループに属するかは groupLabel で返し、ナビの文脈表示に使う。
 */

const byLevelThenOrder = (a, b) =>
  (a.data.level ?? 0) - (b.data.level ?? 0) || (a.data.order ?? 0) - (b.data.order ?? 0);
const byOrder = (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0);
const byReading = (a, b) =>
  (a.data.reading || a.data.term).localeCompare(b.data.reading || b.data.term, "ja");

/**
 * groupField: グループ分けに使う frontmatter の項目
 * groups:     グループの表示順（一覧ページの定数と同一）
 * sort:       グループ内の並び（null = getCollection の既定順＝slug昇順）
 */
const SEQUENCE = {
  learn: {
    groupField: "chapter",
    groups: [
      "お金と市場の基礎", "商品と制度", "リスク管理", "分析手法",
      "法規制とルール", "行動と心理", "テクノロジーと自動化",
    ],
    sort: byLevelThenOrder,
  },
  playbook: {
    groupField: "kind",
    groups: ["定石", "手法", "リスク管理", "心理", "格言"],
    sort: null,
  },
  charts: {
    groupField: "patternType",
    groups: ["反転", "継続", "プライスアクション", "インジケーター"],
    sort: null,
  },
  glossary: {
    groupField: null,
    groups: null,
    sort: byReading,
  },
  books: {
    groupField: "bookCategory",
    groups: [
      "トレード実践", "相場心理", "投資の名著・古典", "インデックス投資・資産形成",
      "編集長おすすめ小説",
    ],
    sort: byOrder,
  },
};

/** 公開記事を「読む順序」に並べた配列を返す */
export function orderedEntries(collection, entries) {
  const spec = SEQUENCE[collection];
  const published = entries.filter((e) => e.data.reviewed);
  if (!spec) return published;
  if (!spec.groupField) {
    return spec.sort ? published.slice().sort(spec.sort) : published;
  }
  return spec.groups.flatMap((g) => {
    const items = published.filter((e) => e.data[spec.groupField] === g);
    return spec.sort ? items.sort(spec.sort) : items;
  });
}

/**
 * 前後の記事を返す。
 * 戻り値: { prev, next, groupLabel }（該当なしは null）
 */
export function neighborsOf(collection, entries, slug) {
  const ordered = orderedEntries(collection, entries);
  const i = ordered.findIndex((e) => e.slug === slug);
  if (i === -1) return { prev: null, next: null, groupLabel: null };
  const spec = SEQUENCE[collection];
  return {
    prev: i > 0 ? ordered[i - 1] : null,
    next: i < ordered.length - 1 ? ordered[i + 1] : null,
    groupLabel: spec?.groupField ? ordered[i].data[spec.groupField] ?? null : null,
    position: i + 1,
    total: ordered.length,
  };
}
