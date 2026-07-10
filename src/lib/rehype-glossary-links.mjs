/**
 * rehypeプラグイン: learn / playbook / charts 本文中の用語（初出）を
 * /glossary/◯◯/ へ自動リンクする（WO-TOUSHI-002(a) 内部リンク網の自動化）。
 * ルール:
 *  - 対象は src/content/{learn,playbook,charts} の本文のみ（glossary自身は対象外）
 *  - 1用語につき初出1箇所・1記事あたり最大5リンク（過剰リンク防止）
 *  - 見出し・既存リンク・コード内はリンクしない
 *  - 語境界判定は src/lib/glossary.mjs（複合語の内部一致を除外）
 *  - 本文埋め込みの生HTML（figure図解等）は raw ノードのため対象外＝安全
 */
import { loadGlossaryDict, findMention } from "./glossary.mjs";

const MAX_LINKS_PER_ARTICLE = 5;
const SKIP_TAGS = new Set(["a", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6", "script", "style"]);
const TARGET_RE = /[\\/]src[\\/]content[\\/](learn|playbook|charts)[\\/]/;

export default function rehypeGlossaryLinks() {
  const dict = loadGlossaryDict();
  return (tree, file) => {
    const path = String(file?.path ?? file?.history?.[0] ?? "");
    if (!TARGET_RE.test(path)) return;

    const linked = new Set(); // slug単位で1回のみ
    let count = 0;

    // テキストノード内の最左（同点なら最長）一致を探す
    const findBest = (text) => {
      let best = null;
      for (const { slug, keys } of dict) {
        if (linked.has(slug)) continue;
        for (const key of keys) {
          const idx = findMention(text, key);
          if (idx === -1) continue;
          if (!best || idx < best.idx || (idx === best.idx && key.length > best.key.length)) {
            best = { slug, key, idx };
          }
        }
      }
      return best;
    };

    // テキストノードを [text, <a>, text, <a>, ...] に分割
    const splitTextNode = (value) => {
      const out = [];
      let rest = value;
      while (rest.length > 0 && count < MAX_LINKS_PER_ARTICLE) {
        const hit = findBest(rest);
        if (!hit) break;
        if (hit.idx > 0) out.push({ type: "text", value: rest.slice(0, hit.idx) });
        out.push({
          type: "element",
          tagName: "a",
          properties: { href: `/glossary/${hit.slug}/`, className: ["term-link"] },
          children: [{ type: "text", value: hit.key }],
        });
        linked.add(hit.slug);
        count++;
        rest = rest.slice(hit.idx + hit.key.length);
      }
      if (rest.length > 0) out.push({ type: "text", value: rest });
      return out;
    };

    const walk = (node) => {
      if (count >= MAX_LINKS_PER_ARTICLE) return;
      if (!node.children) return;
      if (node.type === "element" && SKIP_TAGS.has(node.tagName)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === "text") {
          const replaced = splitTextNode(child.value);
          if (replaced.length > 1 || replaced[0]?.type === "element") {
            node.children.splice(i, 1, ...replaced);
            i += replaced.length - 1;
          }
        } else {
          walk(child);
        }
        if (count >= MAX_LINKS_PER_ARTICLE) return;
      }
    };

    walk(tree);
  };
}
