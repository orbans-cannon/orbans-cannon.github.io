import katex from 'katex';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 緊貼在數學式前後、不該被拆開的 ASCII 字元（例如「pre-prepare(」與「)」）。 */
const TRAIL = /[A-Za-z0-9_\-+.:()[\]{}/]+$/;
const LEAD = /^[A-Za-z0-9_\-+.:()[\]{},;!?]+/;

/**
 * 把字串中 $...$ 的部分用 KaTeX 渲染，其餘部分做 HTML 跳脫。
 * 用於元件 props 傳進來的短字串（props 不會經過 Markdown／remark-math）。
 * 「$」數量不成對、或 LaTeX 有誤時，建置直接失敗。
 *
 * 版面：KaTeX 的輸出是 inline-block，瀏覽器可以在它前後換行，結果「pre-prepare($m$)」
 * 會斷成「pre-prepare(」與「m)」。所以把數學式連同緊貼的 ASCII 字元（括號、標點、英文詞）
 * 包進 <span class="im">（white-space: nowrap，樣式在 custom.css）。只收 ASCII，
 * 不收中文，長的中文句子仍然可以正常換行。
 */
export function renderInline(text: string): string {
  const parts = text.split('$');
  if (parts.length % 2 === 0) {
    throw new Error(`inline-math：「$」數量不成對：${text}`);
  }
  const raw = parts.slice();
  const lead: string[] = parts.map(() => '');
  const trail: string[] = parts.map(() => '');
  for (let j = 1; j < raw.length; j += 2) {
    const before = raw[j - 1].match(TRAIL);
    if (before) {
      trail[j] = before[0];
      raw[j - 1] = raw[j - 1].slice(0, raw[j - 1].length - before[0].length);
    }
    const after = raw[j + 1].match(LEAD);
    if (after) {
      lead[j] = after[0];
      raw[j + 1] = raw[j + 1].slice(after[0].length);
    }
  }
  return raw
    .map((p, i) =>
      i % 2 === 0
        ? escapeHtml(p)
        : `<span class="im">${escapeHtml(trail[i])}${katex.renderToString(p, { throwOnError: true })}${escapeHtml(lead[i])}</span>`,
    )
    .join('');
}
