/**
 * FLM 定理 1 的連通度部分（m=1）：G 有 4 個節點、連通度 2（拿掉 b、d 就使 a、c 分離）。
 * 覆蓋圖 S 是兩份 G 在「a 與牆之間」交叉重接成的 8 個節點。版面與配色規則同 covering-triangle.ts。
 */
import { ctStrings, sub, type Lang } from './strings';
import { wallStrings } from './strings-wall';
import { f1, esc, unit, outward, type Pt } from './covering-triangle';
import type { Dec, Mode, CtState, Model } from './controller';

export type WNode = 'A1' | 'B1' | 'C1' | 'D1' | 'A0' | 'B0' | 'C0' | 'D0';
type GNode = 'a' | 'b' | 'c' | 'd';
export const W_NODES: WNode[] = ['A1', 'B1', 'C1', 'D1', 'A0', 'B0', 'C0', 'D0'];
export const LAST_STEP = 7;

const disp = (n: string) => n[0] + (n[1] === '1' ? '₁' : '₀');
const dev = (n: WNode) => n[0];
const inp = (n: WNode) => (n[1] === '1' ? 1 : 0);
const img = (n: WNode) => n[0].toLowerCase() as GNode;
const preimage = (g: GNode) => [g.toUpperCase() + '0', g.toUpperCase() + '1'] as WNode[];

type E2 = [WNode, WNode];
const BASE: E2[] = [['A1', 'B1'], ['B1', 'C1'], ['C1', 'D1'], ['B1', 'D1'], ['A0', 'B0'], ['B0', 'C0'], ['C0', 'D0'], ['B0', 'D0']];
const CUT: E2[] = [['A1', 'D1'], ['A0', 'D0']];
const NEW: E2[] = [['A0', 'D1'], ['A1', 'D0']];
const G_EDGES: [GNode, GNode][] = [['a', 'b'], ['a', 'd'], ['b', 'c'], ['c', 'd'], ['b', 'd']];

const sNb = (n: WNode) => [...BASE, ...NEW].filter((e) => e.includes(n)).map((e) => (e[0] === n ? e[1] : e[0]));
const gNb = (g: GNode) => G_EDGES.filter((e) => e.includes(g)).map((e) => (e[0] === g ? e[1] : e[0]));

interface Exec {
  frame: WNode[];
  honest: GNode[];
  faulty: GNode;
  msgs: { from: WNode; to: WNode; g: [GNode, GNode] }[];
  /** 判定：Validity 把框內都釘在 pin；Agreement 則要求全部相同 */
  pin: '0' | '1' | null;
}
export const EXECS: Exec[] = [
  { frame: ['A0', 'B0', 'C0'], honest: ['a', 'b', 'c'], faulty: 'd', pin: '0',
    msgs: [{ from: 'D1', to: 'A0', g: ['d', 'a'] }, { from: 'D0', to: 'B0', g: ['d', 'b'] }, { from: 'D0', to: 'C0', g: ['d', 'c'] }] },
  { frame: ['C0', 'D0', 'A1'], honest: ['c', 'd', 'a'], faulty: 'b', pin: null,
    msgs: [{ from: 'B0', to: 'C0', g: ['b', 'c'] }, { from: 'B0', to: 'D0', g: ['b', 'd'] }, { from: 'B1', to: 'A1', g: ['b', 'a'] }] },
  { frame: ['A1', 'B1', 'C1'], honest: ['a', 'b', 'c'], faulty: 'd', pin: '1',
    msgs: [{ from: 'D0', to: 'A1', g: ['d', 'a'] }, { from: 'D1', to: 'B1', g: ['d', 'b'] }, { from: 'D1', to: 'C1', g: ['d', 'c'] }] },
];
const execOf = (step: number) => (step >= 4 && step <= 6 ? step - 4 : -1);

type Verdict = { kind: 'ok' | 'unknown' } | { kind: 'bad'; zeros: WNode[]; ones: WNode[] };
function verdict(i: number, dec: Record<string, Dec>): Verdict {
  const ex = EXECS[i];
  const zeros = ex.frame.filter((n) => dec[n] === '0');
  const ones = ex.frame.filter((n) => dec[n] === '1');
  if (ex.pin === '0') return ones.length ? { kind: 'bad', zeros, ones } : zeros.length === ex.frame.length ? { kind: 'ok' } : { kind: 'unknown' };
  if (ex.pin === '1') return zeros.length ? { kind: 'bad', zeros, ones } : ones.length === ex.frame.length ? { kind: 'ok' } : { kind: 'unknown' };
  if (zeros.length && ones.length) return { kind: 'bad', zeros, ones };
  return zeros.length === ex.frame.length || ones.length === ex.frame.length ? { kind: 'ok' } : { kind: 'unknown' };
}

interface Geom { W: number; H: number; R: number; S: Record<WNode, Pt>; G: Record<GNode, Pt>; sC: Pt; gC: Pt; sTitle: Pt; gTitle: Pt }
function geom(mode: Mode): Geom {
  if (mode === 'wide') {
    return {
      W: 720, H: 415, R: 18,
      S: { C1: { x: 175, y: 62 }, D1: { x: 100, y: 138 }, B1: { x: 250, y: 138 }, A0: { x: 45, y: 212 }, A1: { x: 305, y: 212 }, B0: { x: 100, y: 288 }, D0: { x: 250, y: 288 }, C0: { x: 175, y: 362 } },
      G: { a: { x: 560, y: 100 }, b: { x: 470, y: 215 }, d: { x: 650, y: 215 }, c: { x: 560, y: 335 } },
      sC: { x: 175, y: 212 }, gC: { x: 560, y: 217 }, sTitle: { x: 175, y: 20 }, gTitle: { x: 560, y: 20 },
    };
  }
  return {
    W: 360, H: 690, R: 16,
    S: { C1: { x: 180, y: 66 }, D1: { x: 112, y: 128 }, B1: { x: 248, y: 128 }, A0: { x: 58, y: 190 }, A1: { x: 302, y: 190 }, B0: { x: 112, y: 252 }, D0: { x: 248, y: 252 }, C0: { x: 180, y: 314 } },
    G: { a: { x: 180, y: 440 }, b: { x: 96, y: 524 }, d: { x: 264, y: 524 }, c: { x: 180, y: 608 } },
    sC: { x: 180, y: 190 }, gC: { x: 180, y: 524 }, sTitle: { x: 180, y: 18 }, gTitle: { x: 180, y: 372 },
  };
}

export function renderSvg(state: CtState, mode: Mode, lang: Lang): string {
  const t = ctStrings[lang];
  const w = wallStrings[lang];
  const g = geom(mode);
  const { step, dec, sel } = state;
  const ex = execOf(step);
  const E = ex >= 0 ? EXECS[ex] : null;
  const R = g.R;
  const sp = (n: WNode) => g.S[n];
  const gp = (n: GNode) => g.G[n];
  const out: string[] = [];

  // 膠囊框（一條路徑上的多個節點）：先畫所有外圈，再畫所有內圈
  const capsule = (pts: Pt[], cls: string) => {
    const seg = pts.slice(1).map((p, i) => [pts[i], p] as [Pt, Pt]);
    const ln = (c: string, wd: number) => seg.map(([a, b]) => `<line class="${c}" x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" stroke-width="${wd}"/>`).join('');
    return `<g class="ct-capsule ${cls}">${ln('ct-cap-o', 2 * R + 20)}${ln('ct-cap-i', 2 * R + 16)}</g>`;
  };
  if (E) {
    out.push(capsule(E.frame.map(sp), ''));
    out.push(capsule(E.honest.map(gp), ''));
  } else if (step === LAST_STEP) {
    for (const e of EXECS) out.push(capsule(e.frame.map(sp), 'ct-cap-soft'));
  }
  if (step <= 3) out.push(capsule([gp('b'), gp('d')], 'ct-wall'));

  out.push(`<text class="ct-title" x="${g.sTitle.x}" y="${g.sTitle.y}" text-anchor="middle">${esc(step === 0 ? w.sTitlePending : w.sTitle)}</text>`);
  out.push(`<text class="ct-title" x="${g.gTitle.x}" y="${g.gTitle.y}" text-anchor="middle">${esc(E ? t.gTitleExec(ex + 1, E.faulty) : w.gTitle)}</text>`);
  if (step <= 3) out.push(`<text class="ct-note" x="${g.G.a.x}" y="${f1(g.gC.y + 30)}" text-anchor="middle">${esc(w.wall)}</text>`);

  // S 的邊
  const edge = (a: Pt, b: Pt, cls: string) => `<line class="ct-edge ${cls}" x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}"/>`;
  const msgEdge = new Set(E ? E.msgs.map((m) => [m.from, m.to].sort().join('-')) : []);
  const isMsg = (a: string, b: string) => msgEdge.has([a, b].sort().join('-'));
  if (step >= 1) {
    for (const [a, b] of BASE) if (!isMsg(a, b)) out.push(edge(sp(a), sp(b), ''));
    if (step === 1) for (const [a, b] of CUT) out.push(edge(sp(a), sp(b), ''));
    if (step === 2) for (const [a, b] of CUT) out.push(edge(sp(a), sp(b), 'ct-cut'));
    if (step >= 2) for (const [a, b] of NEW) if (!isMsg(a, b)) out.push(edge(sp(a), sp(b), step === 2 ? 'ct-new' : ''));
  }
  if (step === 2) {
    const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const cm = CUT.map(([a, b]) => mid(sp(a), sp(b)));
    out.push(`<text class="ct-note" x="${f1(cm[0].x)}" y="${f1(cm[0].y - 8)}" text-anchor="middle">${esc(t.cut)}</text>`);
    out.push(`<text class="ct-note" x="${f1(cm[1].x)}" y="${f1(cm[1].y + 16)}" text-anchor="middle">${esc(t.cut)}</text>`);
    for (const [a, b] of NEW) {
      const m = mid(sp(a), sp(b));
      const o = outward(m, g.sC, 14);
      out.push(`<text class="ct-note ct-note-new" x="${f1(o.x)}" y="${f1(o.y)}" text-anchor="${o.anchor}">${esc(t.fresh)}</text>`);
    }
  }

  // 第 1 步：a 到 c 互不相交的兩條路（a–b–c、a–d–c）畫粗
  const pathEdges: [GNode, GNode][] = step === 0 ? [['a', 'b'], ['b', 'c'], ['a', 'd'], ['d', 'c']] : [];
  for (const [a, b] of pathEdges) out.push(edge(gp(a), gp(b), 'ct-path'));
  if (step === 0) {
    const lab = (a: Pt, b: Pt, i: number, left: boolean) => {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      return `<text class="ct-note ct-note-new" x="${f1(mx + (left ? -12 : 12))}" y="${f1(my)}" text-anchor="${left ? 'end' : 'start'}">${esc(w.path(i))}</text>`;
    };
    out.push(lab(gp('a'), gp('b'), 1, true), lab(gp('a'), gp('d'), 2, false));
  }
  // G 的邊
  if (E) {
    for (const [a, b] of G_EDGES) if (E.honest.includes(a) && E.honest.includes(b)) out.push(edge(gp(a), gp(b), ''));
  } else {
    for (const [a, b] of G_EDGES) if (!pathEdges.some((e) => e[0] === a && e[1] === b)) out.push(edge(gp(a), gp(b), ''));
  }

  // 邊界訊息
  const arrow = (a: Pt, b: Pt, label: string, c: Pt, blocked = false) => {
    const u = unit(b, a);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const near = Math.hypot(mx - c.x, my - c.y) < 14; // 邊正好穿過中心（例如 b–d）：標籤改放上方
    const o = near ? { x: 0, y: -1 } : unit({ x: mx, y: my }, c);
    const anchor = o.x > 0.3 ? 'start' : o.x < -0.3 ? 'end' : 'middle';
    return (
      `<line class="ct-msg${blocked ? ' ct-msg-x' : ''}" x1="${f1(a.x + u.x * (R + 2))}" y1="${f1(a.y + u.y * (R + 2))}" x2="${f1(b.x - u.x * (R + 3))}" y2="${f1(b.y - u.y * (R + 3))}" ${blocked ? '' : 'marker-end="url(#ct-arrow)"'}/>` +
      (blocked ? `<text class="ct-x" x="${f1(mx)}" y="${f1(my + 5)}" text-anchor="middle">✕</text>` : '') +
      `<text class="ct-msg-label${blocked ? ' ct-msg-label-x' : ''}" x="${f1(mx + o.x * 15)}" y="${f1(my + o.y * 15 + 4)}" text-anchor="${anchor}">${esc(label)}</text>`
    );
  };
  if (E) {
    for (const m of E.msgs) {
      const lb = `${disp(m.from)}→${disp(m.to)}`;
      out.push(arrow(sp(m.from), sp(m.to), lb, g.sC));
      out.push(arrow(gp(m.g[0]), gp(m.g[1]), lb, g.gC, state.signed));
    }
  }

  // 節點
  const nodeEls: string[] = [];
  const hoverS = sel && step >= 2 ? (sel as WNode) : null;
  const hoverG = hoverS ? img(hoverS) : null;
  const nbS = new Set<string>(hoverS ? sNb(hoverS) : []);
  const nbG = new Set<string>(hoverG ? gNb(hoverG) : []);
  const badge = (p: Pt, c: Pt, d: Dec, cls: string) => {
    const u = unit(p, c);
    const bx = p.x - u.x * (R + 14), by = p.y - u.y * (R + 14);
    return `<g class="ct-badge dec${d === '?' ? 'q' : d} ${cls}"><circle cx="${f1(bx)}" cy="${f1(by)}" r="9.5"/><text x="${f1(bx)}" y="${f1(by + 4)}" text-anchor="middle">${d}</text></g>`;
  };
  if (step >= 1) {
    for (const n of W_NODES) {
      const p = sp(n);
      const ring = hoverS === n ? 'ct-ring' : nbS.has(n) ? 'ct-ring ct-ring-nb' : '';
      const label = outward(p, g.sC, R + 11);
      const aria = `${disp(n)}: ${dev(n)}, input ${inp(n)}${step >= 3 ? `, ${t.decide(disp(n), dec[n])}` : ''}`;
      nodeEls.push(
        `<g class="ct-node in${inp(n)} ${ring}" data-node="${n}" ${step >= 2 ? `tabindex="0" role="button" aria-label="${esc(aria)}"` : ''}>` +
          `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${R}"/>` +
          (ring ? `<circle class="ct-ring-c" cx="${f1(p.x)}" cy="${f1(p.y)}" r="${R + 5}"/>` : '') +
          `<text class="ct-letter" x="${f1(p.x)}" y="${f1(p.y + 5)}" text-anchor="middle">${dev(n)}</text></g>` +
          `<text class="ct-name" x="${f1(label.x)}" y="${f1(label.y)}" text-anchor="${label.anchor}">${disp(n)}</text>`,
      );
      if (step >= 3) nodeEls.push(badge(p, g.sC, dec[n], 'ct-editable'));
    }
  }
  for (const n of ['a', 'b', 'c', 'd'] as GNode[]) {
    const p = gp(n);
    const isFaulty = E?.faulty === n;
    const idx = E ? E.honest.indexOf(n) : -1;
    const s = idx >= 0 && E ? E.frame[idx] : undefined;
    const cls = isFaulty ? 'ctg-faulty' : s ? `in${inp(s)}` : 'ctg-plain';
    const ring = hoverG === n ? 'ct-ring' : nbG.has(n) ? 'ct-ring ct-ring-nb' : '';
    let l1: string = n, l2 = '';
    if (s) l1 = `${n} ≡ ${disp(s)}`;
    else if (step >= 2 && !isFaulty) l2 = `← ${preimage(n).map(disp).join('、')}`;
    const above = n === 'a';
    const y1 = above ? p.y - R - (l2 ? 24 : 10) : p.y + R + 17;
    nodeEls.push(
      `<g class="ct-node ${cls} ${ring}" data-g="${n}">` +
        `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${R}"/>` +
        (ring ? `<circle class="ct-ring-c" cx="${f1(p.x)}" cy="${f1(p.y)}" r="${R + 5}"/>` : '') +
        `<text class="ct-letter" x="${f1(p.x)}" y="${f1(p.y + 5)}" text-anchor="middle">${isFaulty ? 'F' : n.toUpperCase()}</text></g>` +
        `<text class="ct-name${isFaulty ? ' ct-name-faulty' : ''}" x="${f1(p.x)}" y="${f1(y1)}" text-anchor="middle">${esc(l1)}</text>` +
        (l2 ? `<text class="ct-name ct-name-sub" x="${f1(p.x)}" y="${f1(y1 + 14)}" text-anchor="middle">${esc(l2)}</text>` : ''),
    );
    if (s && step >= 3) nodeEls.push(badge(p, g.gC, dec[s], ''));
  }
  if (E) {
    E.frame.forEach((sn, i) => {
      for (const p of [sp(sn), gp(E.honest[i])]) {
        const tx = p.x + R * 0.8, ty = p.y - R * 0.8;
        nodeEls.push(`<g class="ct-tag"><circle cx="${f1(tx)}" cy="${f1(ty)}" r="8.5"/><text x="${f1(tx)}" y="${f1(ty + 4)}" text-anchor="middle">${i + 1}</text></g>`);
      }
    });
  }
  out.push(...nodeEls);

  const defs = `<defs><marker id="ct-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ct-arrow-head" d="M0 1 L9 5 L0 9 z"/></marker></defs>`;
  return `<svg class="ct-svg" viewBox="0 0 ${g.W} ${g.H}" role="group" aria-label="${esc(w.aria)}" xmlns="http://www.w3.org/2000/svg">${defs}${out.join('')}</svg>`;
}

function verdictText(i: number, dec: Record<string, Dec>, lang: Lang) {
  const t = ctStrings[lang];
  const w = wallStrings[lang];
  const v = verdict(i, dec);
  if (v.kind === 'ok') return { cls: 'ok', text: t.ok(i + 1) };
  if (v.kind === 'unknown') return { cls: 'unknown', text: t.unknown(i + 1) };
  if (i === 0) return { cls: 'bad', text: t.bad1(v.ones.map(disp)) };
  if (i === 1) return { cls: 'bad', text: w.bad2(v.zeros.map(disp), v.ones.map(disp)) };
  return { cls: 'bad', text: t.bad3(v.zeros.map(disp)) };
}

export function renderDesc(state: CtState, lang: Lang): string {
  const t = ctStrings[lang];
  const w = wallStrings[lang];
  const { step, dec } = state;
  const s = w.steps[step];
  const parts: string[] = [`<h4 class="ct-h">${esc(s.title)}</h4>`];
  for (const b of s.body ?? []) parts.push(`<p>${esc(b)}</p>`);
  if (s.lines) {
    parts.push('<ul class="ct-lines">');
    for (const l of s.lines) parts.push(`<li><strong>${esc(l.k)}</strong> — ${esc(l.t)}</li>`);
    parts.push('</ul>');
  }
  if (s.result) parts.push(`<p class="ct-result">⇒ ${esc(s.result)}</p>`);
  const ex = execOf(step);
  if (ex >= 0 && state.signed) parts.push(`<p class="ct-verdict ct-signnote">${esc(t.signNote)}</p>`);
  else if (ex >= 0) {
    const v = verdictText(ex, dec, lang);
    if (v.cls !== 'unknown' || W_NODES.some((n) => dec[n] !== '?')) parts.push(`<p class="ct-verdict ${v.cls}">${esc(v.text)}</p>`);
  }
  if (step === LAST_STEP && state.signed) parts.push(`<p class="ct-verdict ct-signnote">${esc(t.signChain)}</p>`);
  if (step === LAST_STEP && !state.signed) {
    const chips = [0, 1, 2].map((i) => {
      const v = verdict(i, dec);
      return `<div class="ct-chip${v.kind === 'bad' ? ' bad' : ''}"><strong>ℰ${sub(i + 1)}</strong><span>${esc(w.roles[i])}</span>${v.kind === 'bad' ? `<em>${esc(t.chainBad)}</em>` : ''}</div>`;
    });
    parts.push(`<div class="ct-chain">${chips[0]}<span class="ct-link-lbl">${esc(t.chainShare('C₀'))}</span>${chips[1]}<span class="ct-link-lbl">${esc(t.chainShare('A₁'))}</span>${chips[2]}</div>`);
    const unset = W_NODES.filter((n) => dec[n] === '?').length;
    const msg = t.chainAll(unset);
    if (msg) parts.push(`<p class="ct-verdict unknown">${esc(msg)}</p>`);
    else for (let i = 0; i < 3; i++) { const v = verdictText(i, dec, lang); if (v.cls === 'bad') parts.push(`<p class="ct-verdict bad">${esc(v.text)}</p>`); }
  }
  return parts.join('');
}

export function hintText(state: CtState, lang: Lang): string {
  const t = ctStrings[lang];
  const { step, sel } = state;
  if (step >= 2 && sel) {
    const n = sel as WNode;
    const im = img(n);
    return t.hintNode({ n: disp(n), d: dev(n), inp: inp(n), nb: sNb(n).map((m) => ({ n: disp(m), d: dev(m) })), im, imNb: gNb(im) }) + (step >= 3 ? ` ${t.hintEdit}` : '');
  }
  return step >= 3 ? t.hintEdit : t.hintIdle;
}

export const emptyDecisions = (): Record<string, Dec> => Object.fromEntries(W_NODES.map((n) => [n, '?'])) as Record<string, Dec>;

export const wallModel: Model = { kind: 'wall', features: { signed: true, m: false }, lastStep: LAST_STEP, nodes: W_NODES, emptyDecisions, renderSvg, renderDesc, hintText };
