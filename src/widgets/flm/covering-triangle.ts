/**
 * FLM 定理 1，n=3、m=1 的互動圖：覆蓋圖 S（圓桌）與現實 G（三角形）並列。
 * 這個檔案只有純函式：給狀態，回傳 SVG 字串與說明的 HTML 字串。
 * 伺服器端（CoveringTriangle.astro）用它輸出結論畫面；瀏覽器端的腳本用同一份來重畫。
 * 配色規則（design.md §顏色系統）：輸入 0／1 用空心／實心，不用模型色；故障用紅；金色只給「目前取出的一組」與可點的控制。
 */
import { ctStrings, type Lang } from './strings';

export type Dec = '?' | '0' | '1';
export type SNode = 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
export type GNode = 'a' | 'b' | 'c';
export type Mode = 'wide' | 'tall';

export const S_NODES: SNode[] = ['u', 'v', 'w', 'x', 'y', 'z'];
export const LAST_STEP = 7;

export const device: Record<SNode, string> = { u: 'A', v: 'B', w: 'C', x: 'A', y: 'B', z: 'C' };
export const input: Record<SNode, 0 | 1> = { u: 0, v: 0, w: 0, x: 1, y: 1, z: 1 };
export const image: Record<SNode, GNode> = { u: 'a', x: 'a', v: 'b', y: 'b', w: 'c', z: 'c' };
const gDevice: Record<GNode, string> = { a: 'A', b: 'B', c: 'C' };
const preimage: Record<GNode, SNode[]> = { a: ['u', 'x'], b: ['v', 'y'], c: ['w', 'z'] };
/** 環上的鄰居（交叉重接之後） */
const ringNb: Record<SNode, [SNode, SNode]> = { u: ['v', 'z'], v: ['u', 'w'], w: ['v', 'x'], x: ['w', 'y'], y: ['x', 'z'], z: ['y', 'u'] };
const gNb: Record<GNode, [GNode, GNode]> = { a: ['b', 'c'], b: ['a', 'c'], c: ['a', 'b'] };

export interface State {
  step: number;
  dec: Record<SNode, Dec>;
  sel: SNode | null;
  signed: boolean;
  m: number;
}

export const emptyDecisions = (): Record<SNode, Dec> => ({ u: '?', v: '?', w: '?', x: '?', y: '?', z: '?' });

interface Exec {
  frame: [SNode, SNode];
  faulty: GNode;
  /** S 的節點 → 它在 G 裡扮演的正確節點 */
  map: Partial<Record<SNode, GNode>>;
  /** 從框外送進框內的邊界訊息：S 裡的 from→to，對應 G 裡故障節點送給 g[1] 的訊息 */
  msgs: { from: SNode; to: SNode; g: [GNode, GNode] }[];
}
export const EXECS: Exec[] = [
  { frame: ['v', 'w'], faulty: 'a', map: { v: 'b', w: 'c' }, msgs: [{ from: 'u', to: 'v', g: ['a', 'b'] }, { from: 'x', to: 'w', g: ['a', 'c'] }] },
  { frame: ['w', 'x'], faulty: 'b', map: { w: 'c', x: 'a' }, msgs: [{ from: 'v', to: 'w', g: ['b', 'c'] }, { from: 'y', to: 'x', g: ['b', 'a'] }] },
  { frame: ['x', 'y'], faulty: 'c', map: { x: 'a', y: 'b' }, msgs: [{ from: 'w', to: 'x', g: ['c', 'a'] }, { from: 'z', to: 'y', g: ['c', 'b'] }] },
];

/** 這一步正在看第幾個執行（0–2），不是 ℰ 步驟則 -1 */
export const execOf = (step: number) => (step >= 4 && step <= 6 ? step - 4 : -1);

export type Verdict = { kind: 'ok' | 'unknown' } | { kind: 'bad'; nodes: SNode[] };

/** 依讀者填的決定，判斷 ℰ_i（i=0..2）是否被迫違反保證 */
export function verdict(i: number, dec: Record<SNode, Dec>): Verdict {
  if (i === 0) {
    const bad = (['v', 'w'] as SNode[]).filter((n) => dec[n] === '1');
    if (bad.length) return { kind: 'bad', nodes: bad };
    return dec.v === '0' && dec.w === '0' ? { kind: 'ok' } : { kind: 'unknown' };
  }
  if (i === 1) {
    if (dec.w !== '?' && dec.x !== '?') return dec.w !== dec.x ? { kind: 'bad', nodes: ['w', 'x'] } : { kind: 'ok' };
    return { kind: 'unknown' };
  }
  const bad = (['x', 'y'] as SNode[]).filter((n) => dec[n] === '0');
  if (bad.length) return { kind: 'bad', nodes: bad };
  return dec.x === '1' && dec.y === '1' ? { kind: 'ok' } : { kind: 'unknown' };
}

// ---------------------------------------------------------------- 幾何

export interface Pt { x: number; y: number }
interface Geom {
  W: number;
  H: number;
  R: number;
  S: Record<SNode, Pt>;
  G: Record<GNode, Pt>;
  sC: Pt;
  gC: Pt;
  sTitle: Pt;
  gTitle: Pt;
}

function geom(mode: Mode): Geom {
  if (mode === 'wide') {
    return {
      W: 720, H: 350, R: 20,
      S: { u: { x: 115, y: 84 }, z: { x: 235, y: 84 }, y: { x: 295, y: 188 }, x: { x: 235, y: 292 }, w: { x: 115, y: 292 }, v: { x: 55, y: 188 } },
      G: { a: { x: 575, y: 100 }, b: { x: 490, y: 284 }, c: { x: 650, y: 284 } },
      sC: { x: 175, y: 188 }, gC: { x: 572, y: 222 },
      sTitle: { x: 175, y: 20 }, gTitle: { x: 572, y: 20 },
    };
  }
  return {
    W: 360, H: 600, R: 19,
    S: { u: { x: 130, y: 84 }, z: { x: 230, y: 84 }, y: { x: 285, y: 170 }, x: { x: 230, y: 256 }, w: { x: 130, y: 256 }, v: { x: 75, y: 170 } },
    G: { a: { x: 180, y: 398 }, b: { x: 105, y: 530 }, c: { x: 255, y: 530 } },
    sC: { x: 180, y: 170 }, gC: { x: 180, y: 486 },
    sTitle: { x: 180, y: 20 }, gTitle: { x: 180, y: 336 },
  };
}

export const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const unit = (p: Pt, c: Pt) => {
  const dx = p.x - c.x, dy = p.y - c.y, l = Math.hypot(dx, dy) || 1;
  return { x: dx / l, y: dy / l };
};
/** 往外推 d 的文字位置，並依方向決定對齊 */
export function outward(p: Pt, c: Pt, d: number) {
  const u = unit(p, c);
  const anchor = u.x > 0.3 ? 'start' : u.x < -0.3 ? 'end' : 'middle';
  return { x: p.x + u.x * d, y: p.y + u.y * d + 4, anchor };
}

// ---------------------------------------------------------------- SVG

const decText = (d: Dec) => (d === '?' ? '?' : d);

export function renderSvg(state: State, mode: Mode, lang: Lang): string {
  const t = ctStrings[lang];
  const g = geom(mode);
  const { step, dec, sel } = state;
  const ex = execOf(step);
  const E = ex >= 0 ? EXECS[ex] : null;
  const editable = step >= 3;
  const out: string[] = [];

  const R = g.R;
  const sp = (n: SNode) => g.S[n];
  const gp = (n: GNode) => g.G[n];

  const letter = (p: Pt, ch: string) =>
    state.m > 1
      ? `<text class="ct-letter" x="${f1(p.x)}" y="${f1(p.y + 1)}" text-anchor="middle">${ch}</text><text class="ct-mult" x="${f1(p.x)}" y="${f1(p.y + 14)}" text-anchor="middle">×${state.m}</text>`
      : `<text class="ct-letter" x="${f1(p.x)}" y="${f1(p.y + 5)}" text-anchor="middle">${ch}</text>`;

  // 1. 金色框：目前取出的一組（畫在最底，用粗線加圓頭做成膠囊；內圈用背景色蓋成框線）
  const capsule = (a: Pt, b: Pt, cls: string) =>
    `<g class="ct-capsule ${cls}"><line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" class="ct-cap-o" stroke-width="${2 * R + 20}"/><line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" class="ct-cap-i" stroke-width="${2 * R + 16}"/></g>`;
  if (E) {
    out.push(capsule(sp(E.frame[0]), sp(E.frame[1]), ''));
    const honest = Object.values(E.map) as GNode[];
    out.push(capsule(gp(honest[0]), gp(honest[1]), ''));
  } else if (step === LAST_STEP) {
    for (const e of EXECS) out.push(capsule(sp(e.frame[0]), sp(e.frame[1]), 'ct-cap-soft'));
  }

  // 2. 標題
  out.push(`<text class="ct-title" x="${g.sTitle.x}" y="${g.sTitle.y}" text-anchor="middle">${esc(step === 0 ? t.sTitlePending : t.sTitle)}</text>`);
  out.push(
    `<text class="ct-title" x="${g.gTitle.x}" y="${g.gTitle.y}" text-anchor="middle">${esc(E ? t.gTitleExec(ex + 1, E.faulty) : t.gTitle)}</text>`,
  );

  // 3. S 的邊
  const edge = (a: Pt, b: Pt, cls: string) =>
    `<line class="ct-edge ${cls}" x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}"/>`;
  const msgFrom = new Set(E ? E.msgs.map((m) => `${m.from}${m.to}`) : []);
  if (step >= 1) {
    const base: [SNode, SNode][] = [['u', 'v'], ['v', 'w'], ['x', 'y'], ['y', 'z']];
    for (const [a, b] of base) if (!msgFrom.has(a + b) && !msgFrom.has(b + a)) out.push(edge(sp(a), sp(b), ''));
    if (step === 1) {
      out.push(edge(sp('u'), sp('w'), ''), edge(sp('x'), sp('z'), ''));
    } else {
      for (const [a, b] of [['u', 'z'], ['w', 'x']] as [SNode, SNode][]) {
        if (!msgFrom.has(a + b) && !msgFrom.has(b + a)) out.push(edge(sp(a), sp(b), step === 2 ? 'ct-new' : ''));
      }
      if (step === 2) {
        out.push(edge(sp('u'), sp('w'), 'ct-cut'), edge(sp('x'), sp('z'), 'ct-cut'));
      }
    }
  }
  // 圖上的「剪斷／新接」標註
  if (step === 2) {
    const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const m1 = mid(sp('u'), sp('w')), m2 = mid(sp('x'), sp('z'));
    out.push(`<text class="ct-note" x="${f1(m1.x + 6)}" y="${f1(m1.y)}" text-anchor="start">${esc(t.cut)}</text>`);
    out.push(`<text class="ct-note" x="${f1(m2.x - 6)}" y="${f1(m2.y)}" text-anchor="end">${esc(t.cut)}</text>`);
    const t1 = mid(sp('u'), sp('z')), t2 = mid(sp('w'), sp('x'));
    out.push(`<text class="ct-note ct-note-new" x="${f1(t1.x)}" y="${f1(t1.y - 10)}" text-anchor="middle">${esc(t.fresh)}</text>`);
    out.push(`<text class="ct-note ct-note-new" x="${f1(t2.x)}" y="${f1(t2.y + 18)}" text-anchor="middle">${esc(t.fresh)}</text>`);
  }

  // 4. G 的邊
  if (E) {
    const honest = Object.values(E.map) as GNode[];
    out.push(edge(gp(honest[0]), gp(honest[1]), ''));
  } else {
    out.push(edge(gp('a'), gp('b'), ''), edge(gp('b'), gp('c'), ''), edge(gp('c'), gp('a'), ''));
  }

  // 5. 邊界訊息：S 裡框外送進框內的邊，與 G 裡故障節點重播的邊（同樣的標籤、同樣的紅色虛線）
  const arrow = (a: Pt, b: Pt, label: string, c: Pt, blocked = false) => {
    const u = unit(b, a);
    const x1 = b.x - u.x * (R + 3), y1 = b.y - u.y * (R + 3);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const o = unit({ x: mx, y: my }, c);
    const lx = mx + o.x * 15, ly = my + o.y * 15 + 4;
    const anchor = o.x > 0.3 ? 'start' : o.x < -0.3 ? 'end' : 'middle';
    return (
      `<line class="ct-msg${blocked ? ' ct-msg-x' : ''}" x1="${f1(a.x + u.x * (R + 2))}" y1="${f1(a.y + u.y * (R + 2))}" x2="${f1(x1)}" y2="${f1(y1)}" ${blocked ? '' : 'marker-end="url(#ct-arrow)"'}/>` +
      (blocked ? `<text class="ct-x" x="${f1(mx)}" y="${f1(my + 5)}" text-anchor="middle">✕</text>` : '') +
      `<text class="ct-msg-label${blocked ? ' ct-msg-label-x' : ''}" x="${f1(lx)}" y="${f1(ly)}" text-anchor="${anchor}">${esc(label)}</text>`
    );
  };
  if (E) {
    for (const m of E.msgs) {
      out.push(arrow(sp(m.from), sp(m.to), `${m.from}→${m.to}`, g.sC));
      out.push(arrow(gp(m.g[0]), gp(m.g[1]), `${m.from}→${m.to}`, g.gC, state.signed));
    }
  }

  // 6. 節點
  const nodeEls: string[] = [];
  const hoverS = sel && step >= 2 ? sel : null;
  const hoverG = hoverS ? image[hoverS] : null;
  const nbS = new Set<SNode>(hoverS ? ringNb[hoverS] : []);
  const nbG = new Set<GNode>(hoverG ? gNb[hoverG] : []);

  const badge = (p: Pt, c: Pt, d: Dec, cls: string) => {
    const u = unit(p, c);
    const bx = p.x - u.x * (R + 15), by = p.y - u.y * (R + 15);
    return `<g class="ct-badge dec${d === '?' ? 'q' : d} ${cls}"><circle cx="${f1(bx)}" cy="${f1(by)}" r="10"/><text x="${f1(bx)}" y="${f1(by + 4)}" text-anchor="middle">${decText(d)}</text></g>`;
  };

  if (step >= 1) {
    for (const n of S_NODES) {
      const p = sp(n);
      const ring = hoverS === n ? 'ct-ring' : nbS.has(n) ? 'ct-ring ct-ring-nb' : '';
      const inFrame = E && E.frame.includes(n);
      const label = outward(p, g.sC, R + 12);
      const aria = `${n}: ${device[n]}, input ${input[n]}${step >= 3 ? `, ${t.decide(n, dec[n] === '?' ? '?' : dec[n])}` : ''}`;
      nodeEls.push(
        `<g class="ct-node in${input[n]}${inFrame ? ' ct-in-frame' : ''} ${ring}" data-node="${n}" ${step >= 2 ? `tabindex="0" role="button" aria-label="${esc(aria)}"` : ''}>` +
          `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${R}"/>` +
          (ring ? `<circle class="ct-ring-c" cx="${f1(p.x)}" cy="${f1(p.y)}" r="${R + 5}"/>` : '') +
          `${letter(p, device[n])}</g>` +
          `<text class="ct-name" x="${f1(label.x)}" y="${f1(label.y)}" text-anchor="${label.anchor}">${n}·${input[n]}</text>`,
      );
      if (step >= 3) nodeEls.push(badge(p, g.sC, dec[n], editable ? 'ct-editable' : ''));
    }
  }
  for (const n of ['a', 'b', 'c'] as GNode[]) {
    const p = gp(n);
    const isFaulty = E?.faulty === n;
    const s = E ? (Object.entries(E.map) as [SNode, GNode][]).find(([, v]) => v === n)?.[0] : undefined;
    const cls = isFaulty ? 'ctg-faulty' : s !== undefined ? `in${input[s]}` : 'ctg-plain';
    const ring = hoverG === n ? 'ct-ring' : nbG.has(n) ? 'ct-ring ct-ring-nb' : '';
    const label = n === 'a' ? { x: p.x, y: p.y - R - 10, anchor: 'middle' } : { x: p.x, y: p.y + R + 20, anchor: 'middle' };
    let name: string = n;
    if (s) name = `${n} ≡ ${s}`;
    else if (step >= 2 && !isFaulty) name = `${n} ← ${preimage[n].join('、')}`;
    else if (step >= 2) name = `${n}`;
    nodeEls.push(
      `<g class="ct-node ${cls} ${ring}" data-g="${n}">` +
        `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${R}"/>` +
        (ring ? `<circle class="ct-ring-c" cx="${f1(p.x)}" cy="${f1(p.y)}" r="${R + 5}"/>` : '') +
        `${letter(p, isFaulty ? 'F' : gDevice[n])}</g>` +
        `<text class="ct-name${isFaulty ? ' ct-name-faulty' : ''}" x="${f1(label.x)}" y="${f1(label.y)}" text-anchor="${label.anchor}">${esc(name)}</text>`,
    );
    if (s && step >= 3) nodeEls.push(badge(p, g.gC, dec[s], ''));
  }
  // 7. 配對標記：框內的 S 節點與它在 G 裡扮演的正確節點，戴同一個編號（金色小圓）
  if (E) {
    (Object.entries(E.map) as [SNode, GNode][]).forEach(([sn, gn], i) => {
      for (const p of [sp(sn), gp(gn)]) {
        const tx = p.x + R * 0.8, ty = p.y - R * 0.8;
        nodeEls.push(`<g class="ct-tag"><circle cx="${f1(tx)}" cy="${f1(ty)}" r="8.5"/><text x="${f1(tx)}" y="${f1(ty + 4)}" text-anchor="middle">${i + 1}</text></g>`);
      }
    });
  }
  out.push(...nodeEls);

  const defs = `<defs><marker id="ct-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ct-arrow-head" d="M0 1 L9 5 L0 9 z"/></marker></defs>`;
  return `<svg class="ct-svg" viewBox="0 0 ${g.W} ${g.H}" role="group" aria-label="${esc(t.aria)}" xmlns="http://www.w3.org/2000/svg">${defs}${out.join('')}</svg>`;
}

// ---------------------------------------------------------------- 說明

const subN = (i: number) => ['₁', '₂', '₃'][i];

function verdictText(i: number, dec: Record<SNode, Dec>, t: (typeof ctStrings)[Lang]) {
  const v = verdict(i, dec);
  if (v.kind === 'ok') return { cls: 'ok', text: t.ok(i + 1) };
  if (v.kind === 'unknown') return { cls: 'unknown', text: t.unknown(i + 1) };
  if (i === 0) return { cls: 'bad', text: t.bad1(v.nodes) };
  if (i === 1) return { cls: 'bad', text: t.bad2(dec.w, dec.x) };
  return { cls: 'bad', text: t.bad3(v.nodes) };
}

/** 逐步說明的 HTML（標題、說明、Fault／Locality 等逐行、讀者填的決定的判定、串接圖） */
export function renderDesc(state: State, lang: Lang): string {
  const t = ctStrings[lang];
  const { step, dec } = state;
  const s = t.steps[step];
  const parts: string[] = [`<h4 class="ct-h">${esc(s.title)}</h4>`];
  for (const b of s.body ?? []) parts.push(`<p>${esc(b)}</p>`);
  if (s.lines) {
    parts.push('<ul class="ct-lines">');
    for (const l of s.lines) parts.push(`<li><strong>${esc(l.k)}</strong> — ${esc(l.t)}</li>`);
    parts.push('</ul>');
  }
  if (s.result) parts.push(`<p class="ct-result">⇒ ${esc(s.result)}</p>`);
  if (state.m > 1) parts.push(`<p class="ct-mnote">${esc(t.mNote(state.m))}</p>`);
  const ex = execOf(step);
  if (ex >= 0 && state.signed) parts.push(`<p class="ct-verdict ct-signnote">${esc(t.signNote)}</p>`);
  else if (ex >= 0 && step >= 4) {
    const v = verdictText(ex, dec, t);
    if (v.cls !== 'unknown' || S_NODES.some((n) => dec[n] !== '?')) parts.push(`<p class="ct-verdict ${v.cls}">${esc(v.text)}</p>`);
  }
  if (step === LAST_STEP && state.signed) parts.push(`<p class="ct-verdict ct-signnote">${esc(t.signChain)}</p>`);
  if (step === LAST_STEP && !state.signed) {
    const labels = [['ℰ₁', 'a'], ['ℰ₂', 'b'], ['ℰ₃', 'c']];
    const chips = [0, 1, 2].map((i) => {
      const v = verdict(i, dec);
      return `<div class="ct-chip${v.kind === 'bad' ? ' bad' : ''}"><strong>${labels[i][0]}</strong><span>${lang === 'en' ? `${labels[i][1]} is Byzantine` : `${labels[i][1]} 故障`}</span>${v.kind === 'bad' ? `<em>${esc(t.chainBad)}</em>` : ''}</div>`;
    });
    parts.push(
      `<div class="ct-chain">${chips[0]}<span class="ct-link-lbl">${esc(t.chainShare('w'))}</span>${chips[1]}<span class="ct-link-lbl">${esc(t.chainShare('x'))}</span>${chips[2]}</div>`,
    );
    const unset = S_NODES.filter((n) => dec[n] === '?').length;
    const msg = t.chainAll(unset);
    if (msg) parts.push(`<p class="ct-verdict unknown">${esc(msg)}</p>`);
    else for (let i = 0; i < 3; i++) { const v = verdictText(i, dec, t); if (v.cls === 'bad') parts.push(`<p class="ct-verdict bad">${esc(v.text)}</p>`); }
  }
  return parts.join('');
}

/** 滑鼠移到 S 的節點時，圖下方的說明 */
export function hintText(state: State, lang: Lang): string {
  const t = ctStrings[lang];
  const { step, sel } = state;
  if (step >= 2 && sel) {
    const im = image[sel];
    return t.hintNode({
      n: sel, d: device[sel], inp: input[sel],
      nb: ringNb[sel].map((m) => ({ n: m, d: device[m] })),
      im, imNb: gNb[im],
    }) + (step >= 3 ? ` ${t.hintEdit}` : '');
  }
  if (step >= 3) return t.hintEdit;
  return t.hintIdle;
}

export { subN };

import type { Model } from './controller';
export const triangleModel: Model = {
  kind: 'triangle',
  features: { signed: true, m: true },
  lastStep: LAST_STEP,
  nodes: S_NODES,
  emptyDecisions,
  renderSvg: (st, mode, lang) => renderSvg(st as State, mode, lang),
  renderDesc: (st, lang) => renderDesc(st as State, lang),
  hintText: (st, lang) => hintText(st as State, lang),
};
