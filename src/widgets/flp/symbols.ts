/**
 * FLP 互動圖共用的小工具：型別、座標、價態符號（0-valent / 1-valent / bivalent）、箭頭。
 * 價態用形狀表示，不用顏色：空心＝0-valent，實心＝1-valent，左空右實的半圓＝bivalent，虛線＝還沒標。
 * 顏色規則見 design.md §顏色系統：紅色只給矛盾與被違反，金色只給目前選中與可操作的控制。
 */
export type Val = '?' | '0' | '1' | 'B';
export type Lang = 'zh-TW' | 'en';
export type Mode = 'wide' | 'tall';
export interface Pt { x: number; y: number }

export const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const sub = (i: number) => '₀₁₂₃₄₅₆₇₈₉'.charAt(i);

/** 價態符號。extra 是額外的 class（例如 fv-bad 代表矛盾）。 */
export function valSym(p: Pt, r: number, v: Val, extra = ''): string {
  const c = `cx="${f1(p.x)}" cy="${f1(p.y)}" r="${r}"`;
  const edge = `<circle class="fv-edge" ${c}/>`;
  if (v === 'B') {
    const half = `M${f1(p.x)} ${f1(p.y - r)}A${r} ${r} 0 0 1 ${f1(p.x)} ${f1(p.y + r)}Z`;
    return `<g class="fv fvB ${extra}"><circle class="fv-ring" ${c}/><path class="fv-half" d="${half}"/>${edge}</g>`;
  }
  const k = v === '?' ? 'q' : v;
  return `<g class="fv fv${k} ${extra}"><circle class="fv-ring" ${c}/>${edge}<text class="fv-t" x="${f1(p.x)}" y="${f1(p.y + 5)}" text-anchor="middle">${v}</text></g>`;
}

/** 帶箭頭的線：從 a 到 b，兩端各縮短 ra、rb（避開節點的圓）。 */
export function arrow(a: Pt, b: Pt, cls: string, ra = 0, rb = 0): string {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  const u = { x: dx / l, y: dy / l };
  const s = { x: a.x + u.x * ra, y: a.y + u.y * ra };
  const t = { x: b.x - u.x * rb, y: b.y - u.y * rb };
  const bc = { x: t.x - u.x * 8, y: t.y - u.y * 8 };
  const n = { x: -u.y * 3.8, y: u.x * 3.8 };
  const head = `${f1(t.x)},${f1(t.y)} ${f1(bc.x + n.x)},${f1(bc.y + n.y)} ${f1(bc.x - n.x)},${f1(bc.y - n.y)}`;
  return `<g class="fp-arrow ${cls}"><line x1="${f1(s.x)}" y1="${f1(s.y)}" x2="${f1(bc.x)}" y2="${f1(bc.y)}"/><polygon points="${head}"/></g>`;
}

/** 沒有箭頭的線（虛線連結用）。 */
export function link(a: Pt, b: Pt, cls: string, ra = 0, rb = 0): string {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  const u = { x: dx / l, y: dy / l };
  return `<line class="fp-link ${cls}" x1="${f1(a.x + u.x * ra)}" y1="${f1(a.y + u.y * ra)}" x2="${f1(b.x - u.x * rb)}" y2="${f1(b.y - u.y * rb)}"/>`;
}

/** 線上標籤：放在線段中點，沿垂直方向偏移 off。 */
export function edgeLabel(a: Pt, b: Pt, text: string, off: number, cls = ''): string {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  const mx = (a.x + b.x) / 2 + (-dy / l) * off;
  const my = (a.y + b.y) / 2 + (dx / l) * off + 4;
  return `<text class="fp-elabel ${cls}" x="${f1(mx)}" y="${f1(my)}" text-anchor="middle">${esc(text)}</text>`;
}
