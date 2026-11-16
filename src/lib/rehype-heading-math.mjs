/**
 * 標題裡有 $數學$ 時，右側目錄會出現「Δ\DeltaΔ」這種重複字：
 * KaTeX 會輸出三份文字（MathML、TeX 原始碼 annotation、畫面用的 HTML），
 * 而 Astro 收集標題文字時三份都算進去。
 *
 * 這個外掛只處理 h1–h6 裡的 KaTeX：拿掉 MathML 那一份（含 annotation），
 * 並把畫面用的 HTML 那份的 aria-hidden 拿掉，讓讀螢幕器改讀它。
 * 結果：目錄只剩一份文字（例如「先分清 Δ 與 δ」），畫面不變。
 * 必須排在 rehype-katex 之後。
 */
function hasClass(node, name) {
  const c = node.properties?.className;
  return Array.isArray(c) ? c.includes(name) : c === name;
}

function walk(node, fn) {
  fn(node);
  if (node.children) for (const child of node.children) walk(child, fn);
}

export default function rehypeHeadingMath() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'element' || !/^h[1-6]$/.test(node.tagName)) return;
      walk(node, (n) => {
        if (!n.children) return;
        n.children = n.children.filter((c) => !(c.type === 'element' && hasClass(c, 'katex-mathml')));
        if (n.type === 'element' && hasClass(n, 'katex-html') && n.properties) {
          delete n.properties.ariaHidden;
          delete n.properties['aria-hidden'];
        }
      });
    });
  };
}
