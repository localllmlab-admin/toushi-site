import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const pub = (arr, base) => arr.filter((e) => e.data.reviewed)
    .map((e) => ({
      title: e.data.title,
      description: e.data.description,
      pubDate: e.data.updated,
      link: `${base}${e.slug}/`,
    }));
  const items = [
    ...pub(await getCollection("learn"), "/learn/"),
    ...pub(await getCollection("playbook"), "/playbook/"),
    ...pub(await getCollection("charts"), "/charts/"),
  ].sort((a, b) => b.pubDate - a.pubDate);

  return rss({
    title: "投資の学び場",
    description: "誠実な投資・トレード教育コンテンツの更新情報",
    site: context.site ?? "https://example.jp",
    items,
  });
}
