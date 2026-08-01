/**
 * 構造化データ（JSON-LD）の組み立てヘルパー。
 *
 * 方針:
 * - サイト共通の WebSite / Organization は Base.astro がトップページに1回だけ出す。
 *   個別ページはそれを @id 参照するだけにして、同じ実体を重複定義しない。
 * - 一覧ページは CollectionPage + ItemList。Googleに「ここは索引ページ」と伝え、
 *   配下の記事へのクロール経路を機械可読にする。
 */

export const SITE_NAME = "投資の学び舎（まなびや）";
export const SITE_URL = "https://toushi-manabiya.jp/";

const abs = (path, siteUrl = SITE_URL) => new URL(path, siteUrl).href;

/** セクション（コレクション）の表示名とパス */
export const SECTIONS = {
  learn: { label: "学ぶ", path: "/learn/" },
  playbook: { label: "手法・定石", path: "/playbook/" },
  charts: { label: "チャート図解", path: "/charts/" },
  glossary: { label: "用語集", path: "/glossary/" },
  books: { label: "おすすめ書籍", path: "/books/" },
  topics: { label: "テーマ別", path: "/topics/" },
};

/**
 * 一覧ページ用 CollectionPage + ItemList。
 * items: [{ url: "/learn/foo/", name: "タイトル" }]
 */
export function collectionPageJsonLd({ path, name, description, items, siteUrl = SITE_URL }) {
  const url = abs(path, siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    url,
    name,
    description,
    inLanguage: "ja",
    isPartOf: { "@id": `${siteUrl}#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: abs(it.url, siteUrl),
        name: it.name,
      })),
    },
  };
}

/**
 * パンくず。trail: [{ name, url }]（末尾＝現在地。urlは必須）
 * 画面表示（Breadcrumb.astro）と同じ配列を渡し、表示と構造化データを一致させる。
 */
export function breadcrumbJsonLd({ trail, siteUrl = SITE_URL }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.url, siteUrl),
    })),
  };
}
