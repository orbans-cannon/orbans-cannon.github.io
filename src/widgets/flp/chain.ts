/**
 * 圖 A（引理 2）：8 個初始配置排成一條鏈，讀者替每個配置標結局（預填「等三個輸入到齊才做多數決」），
 * 圖找出相鄰且結局相反的一對，放大成兩張卡片，再畫出「兩個世界，只差一個沉默的 process」。純函式。
 */
import { arrow, esc, f1, sub, valSym, type Lang, type Mode, type Pt, type Val } from './symbols';
import { CHAIN, C, type ChainInfo, type StepText } from './strings';
import type { FlpModel } from './controller';

export const ORDER = ['000', '001', '011', '010', '110', '111', '101', '100'];
export const LAST = 3;
export interface ChainState { step: number; lab: Record<string, Val>; v: '0' | '1'; sel: string | null }

export const emptyLab = (): Record<string, Val> => Object.fromEntries(ORDER.map((c) => [c, '?'])) as Record<string, Val>;
/** 範例：等三個輸入到齊才做多數決，結局就是多數 */
export function exampleLab(): Record<string, Val> {
  const lab = emptyLab();
  for (const c of ORDER) lab[c] = [...c].filter((b) => b === '1').length >= 2 ? '1' : '0';
  return lab;
}
export function randomLab(): Record<string, Val> {
  for (;;) {
    const lab = emptyLab();
    for (const c of ORDER) lab[c] = Math.random() < 0.5 ? '0' : '1';
    const vs = new Set(Object.values(lab));
    if (vs.has('0') && vs.has('1')) return lab;
  }
}

export function derive(lab: Record<string, Val>, v: '0' | '1'): ChainInfo {
  const vals = ORDER.map((c) => lab[c]);
  const info: ChainInfo = {
    n0: vals.filter((x) => x === '0').length,
    n1: vals.filter((x) => x === '1').length,
    nb: vals.filter((x) => x === 'B').length,
    nq: vals.filter((x) => x === '?').length,
    pair: null,
    v,
  };
  for (let i = 0; i < ORDER.length - 1; i++) {
    const a = lab[ORDER[i]], b = lab[ORDER[i + 1]];
    if ((a === '0' && b === '1') || (a === '1' && b === '0')) {
      const c0 = a === '0' ? ORDER[i] : ORDER[i + 1];
      const c1 = a === '0' ? ORDER[i + 1] : ORDER[i];
      let p = 1;
      for (let k = 0; k < 3; k++) if (c0[k] !== c1[k]) p = k + 1;
      info.pair = { c0, c1, p };
      break;
    }
  }
  return info;
}

const cycle: Record<Val, Val> = { '?': '0', '0': '1', '1': 'B', B: '?' };
const P = (n: number) => `p${sub(n)}`;

interface G {
  W: number; r: number; x: (i: number) => number; yChain: number; yIn: number; yName: number; yBody: number;
  card: { w: number; h: number; xL: number; xR: number; cr: number; sp: number };
  world: { w: number; h: number; xs: [number, number]; stacked: boolean; gap: number };
}
function geom(mode: Mode): G {
  if (mode === 'wide') {
    return {
      W: 720, r: 20, x: (i) => 52 + i * 88, yChain: 52, yIn: 94, yName: 116, yBody: 156,
      card: { w: 214, h: 124, xL: 96, xR: 410, cr: 13, sp: 46 },
      world: { w: 344, h: 290, xs: [8, 368], stacked: false, gap: 0 },
    };
  }
  return {
    W: 360, r: 14, x: (i) => 24 + i * 44.6, yChain: 44, yIn: 78, yName: 98, yBody: 138,
    card: { w: 164, h: 120, xL: 10, xR: 186, cr: 10, sp: 34 },
    world: { w: 344, h: 290, xs: [8, 8], stacked: true, gap: 44 },
  };
}

const bitOf = (c: string, k: number) => c[k] === '1';
const fs = (small: boolean, a: number, b: number) => `font-size:${small ? a : b}px`;

function card(g: G, x: number, y: number, cfg: string, title: string, val: '0' | '1', p: number, lang: Lang, small: boolean): string {
  const T = CHAIN(lang);
  const k = g.card;
  const o: string[] = [`<rect class="fa-card" x="${x}" y="${y}" width="${k.w}" height="${k.h}" rx="8"/>`];
  o.push(`<text class="fp-name fp-strong" x="${x + 12}" y="${y + 24}" style="${fs(small, 12.5, 14)}">${esc(title)}</text>`);
  o.push(valSym({ x: x + k.w - 22, y: y + 20 }, 10, val));
  for (let i = 0; i < 3; i++) {
    const cx = x + k.w / 2 + (i - 1) * k.sp, cy = y + 64;
    const diff = i + 1 === p;
    o.push(`<circle class="fa-in big ${bitOf(cfg, i) ? 'one' : ''} ${diff ? 'diff' : ''}" cx="${f1(cx)}" cy="${cy}" r="${k.cr}"/>`);
    o.push(`<text class="fa-bit ${diff ? 'diff' : ''}" x="${f1(cx)}" y="${cy + k.cr + 17}" text-anchor="middle" style="${fs(small, 11.5, 13)}">${P(i + 1)}</text>`);
  }
  o.push(`<text class="fp-note" x="${x + k.w / 2}" y="${y + k.h - 10}" text-anchor="middle" style="${fs(small, 10.5, 12)}">${esc(T.cardNote[val])}</text>`);
  return o.join('');
}

function world(g: G, x: number, y: number, cfg: string, title: string, bad: boolean, info: ChainInfo, lang: Lang, small: boolean, contra: string): string {
  const T = CHAIN(lang);
  const w = g.world.w, h = g.world.h;
  const d = info.pair!.p;
  const others = [1, 2, 3].filter((k) => k !== d);
  const [a, b] = others;
  const r = 18;
  const pa: Pt = { x: x + 66, y: y + 122 }, pb: Pt = { x: x + w - 66, y: y + 122 };
  const o: string[] = [`<rect class="fa-panel ${bad ? 'bad' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`];
  o.push(`<text class="fp-name fp-strong" x="${x + 14}" y="${y + 24}" style="${fs(small, 12.5, 14)}">${esc(title)}</text>`);
  // 兩個還活著的 process
  for (const [pt, k] of [[pa, a], [pb, b]] as [Pt, number][]) {
    o.push(`<circle class="fw-tok" cx="${f1(pt.x)}" cy="${pt.y}" r="${r}"/><text class="fw-t" x="${f1(pt.x)}" y="${pt.y + 5}" text-anchor="middle">${P(k)}</text>`);
    o.push(`<text class="fa-bit" x="${f1(pt.x)}" y="${pt.y + r + 18}" text-anchor="middle" style="${fs(small, 11.5, 13)}">${esc(T.inputLbl(cfg[k - 1]))}</text>`);
  }
  // 互相收發訊息
  [-16, 0, 16].forEach((dy, i) => {
    const yy = pa.y + dy;
    const from: Pt = i % 2 === 0 ? { x: pa.x + r + 6, y: yy } : { x: pb.x - r - 6, y: yy };
    const to: Pt = i % 2 === 0 ? { x: pb.x - r - 6, y: yy } : { x: pa.x + r + 6, y: yy };
    o.push(arrow(from, to, ''));
  });
  o.push(`<text class="fp-note" x="${f1((pa.x + pb.x) / 2)}" y="${y + 84}" text-anchor="middle" style="${fs(small, 11, 12.5)}">${esc(T.msgs)}</text>`);
  // 決定
  o.push(arrow({ x: pb.x, y: pb.y - r - 2 }, { x: pb.x, y: y + 78 }, ''));
  o.push(valSym({ x: pb.x, y: y + 62 }, 12, info.v, bad ? 'fv-bad' : ''));
  o.push(`<text class="fp-note" x="${f1(pb.x - 20)}" y="${y + 66}" text-anchor="end" style="${fs(small, 11, 12.5)}">${esc(T.decideTxt)}</text>`);
  // 牆與沉默的 process
  o.push(`<line class="fw-wall" x1="${x + 16}" y1="${y + 176}" x2="${x + w - 16}" y2="${y + 176}"/>`);
  o.push(`<text class="fp-note" x="${f1(x + w / 2)}" y="${y + 194}" text-anchor="middle" style="${fs(small, 11, 12.5)}">${esc(T.wall(d))}</text>`);
  const ps: Pt = { x: x + w / 2, y: y + 232 };
  o.push(`<circle class="fw-tok sleep" cx="${f1(ps.x)}" cy="${ps.y}" r="${r}"/><text class="fw-t sleep" x="${f1(ps.x)}" y="${ps.y + 5}" text-anchor="middle">${P(d)}</text>`);
  o.push(`<text class="fp-x" x="${f1(ps.x + 26)}" y="${ps.y + 6}">✗</text>`);
  o.push(`<text class="fa-bit diff" x="${f1(ps.x - 28)}" y="${ps.y + 5}" text-anchor="end" style="${fs(small, 11.5, 13)}">${esc(T.inputLbl(cfg[d - 1]))}</text>`);
  o.push(`<text class="fp-note fp-bad" x="${f1(ps.x)}" y="${ps.y + 36}" text-anchor="middle" style="${fs(small, 11, 12.5)}">${esc(T.stopped(d))}</text>`);
  if (bad) o.push(`<text class="fp-note fp-bad" x="${f1(x + w / 2)}" y="${y + h - 8}" text-anchor="middle" style="${fs(small, 11, 12.5)}">${esc(contra)}</text>`);
  return o.join('');
}

export function renderSvg(s: ChainState, mode: Mode, lang: Lang): string {
  const g = geom(mode);
  const T = CHAIN(lang);
  const info = derive(s.lab, s.v);
  const pair = info.pair;
  const out: string[] = [];
  const small = mode === 'tall';
  const ir = small ? 3.4 : 5;
  const ispace = small ? 9.5 : 14;

  for (let i = 0; i < ORDER.length - 1; i++) {
    const a: Pt = { x: g.x(i), y: g.yChain }, b: Pt = { x: g.x(i + 1), y: g.yChain };
    let p = 1;
    for (let k = 0; k < 3; k++) if (ORDER[i][k] !== ORDER[i + 1][k]) p = k + 1;
    out.push(`<line x1="${f1(a.x + g.r)}" y1="${g.yChain}" x2="${f1(b.x - g.r)}" y2="${g.yChain}" style="stroke:var(--sl-color-gray-4);stroke-width:1.6"/>`);
    out.push(`<text class="fp-note" x="${f1((a.x + b.x) / 2)}" y="${small ? g.yChain - g.r - 4 : g.yChain - 6}" text-anchor="middle" style="${fs(small, 9.5, 12)}">p${sub(p)}</text>`);
  }
  for (let i = 0; i < ORDER.length; i++) {
    const cfg = ORDER[i];
    const c: Pt = { x: g.x(i), y: g.yChain };
    const val = s.lab[cfg];
    const isPair = !!pair && s.step >= 1 && (cfg === pair.c0 || cfg === pair.c1);
    const sel = s.sel === cfg;
    const diffProc = pair && isPair ? pair.p : 0;
    out.push(
      `<g data-hit="${cfg}" tabindex="0" role="button" aria-label="${esc(T.hintNode(cfg, T.valName[val]))}">` +
        `<rect x="${f1(c.x - g.r - 4)}" y="${f1(c.y - g.r - 4)}" width="${f1(2 * g.r + 8)}" height="${f1(g.yName + 8 - c.y + g.r)}" fill="transparent"/>` +
        valSym(c, g.r, val) +
        (isPair ? `<circle class="fp-ring" cx="${f1(c.x)}" cy="${f1(c.y)}" r="${g.r + 5}"/>` : sel ? `<circle class="fp-ring" cx="${f1(c.x)}" cy="${f1(c.y)}" r="${g.r + 4}" style="stroke-dasharray:3 3"/>` : '') +
        [0, 1, 2].map((k) => `<circle class="fa-in ${bitOf(cfg, k) ? 'one' : ''} ${diffProc === k + 1 ? 'diff' : ''}" cx="${f1(c.x + (k - 1) * ispace)}" cy="${g.yIn}" r="${ir}"/>`).join('') +
        `<text class="fp-name ${isPair ? 'fp-sel' : ''}" x="${f1(c.x)}" y="${g.yName}" text-anchor="middle" style="${fs(small, 10, 12.5)}">${cfg}</text>` +
        `</g>`,
    );
  }
  if (pair && s.step >= 1) {
    const i0 = ORDER.indexOf(pair.c0), i1 = ORDER.indexOf(pair.c1);
    out.push(
      `<text class="fp-name fp-sel" x="${f1(g.x(i0))}" y="${g.yName + 16}" text-anchor="middle" style="${fs(small, 10, 12.5)}">C₀</text>`,
      `<text class="fp-name fp-sel" x="${f1(g.x(i1))}" y="${g.yName + 16}" text-anchor="middle" style="${fs(small, 10, 12.5)}">C₁</text>`,
    );
  }

  let H = g.yBody - 8;
  if (pair && s.step === 1) {
    const k = g.card;
    out.push(card(g, k.xL, g.yBody, pair.c0, `C₀ = ${pair.c0}`, '0', pair.p, lang, small));
    out.push(card(g, k.xR, g.yBody, pair.c1, `C₁ = ${pair.c1}`, '1', pair.p, lang, small));
    out.push(`<text class="fp-name fp-sel" x="${g.W / 2}" y="${g.yBody + k.h + 26}" text-anchor="middle" style="${fs(small, 12, 14)}">${esc(T.pairNote(pair.p))}</text>`);
    H = g.yBody + k.h + 40;
  } else if (pair && s.step >= 2) {
    const w = g.world;
    const bad0 = s.step >= 3 && s.v === '1';
    const bad1 = s.step >= 3 && s.v === '0';
    const y0 = g.yBody;
    const y1 = w.stacked ? y0 + w.h + w.gap : y0;
    out.push(world(g, w.xs[0], y0, pair.c0, T.world0(pair.c0), bad0, info, lang, small, T.contra0));
    out.push(world(g, w.xs[1], y1, pair.c1, T.world1(pair.c1), bad1, info, lang, small, T.contra1));
    const others = [1, 2, 3].filter((k) => k !== pair.p);
    const conn = T.sameView(others[0], others[1]);
    if (w.stacked) {
      out.push(`<text class="fp-name fp-strong" x="${g.W / 2}" y="${y0 + w.h + 27}" text-anchor="middle" style="${fs(small, 11, 13)}">↓ ${esc(conn)}</text>`);
      H = y1 + w.h + 10;
    } else {
      out.push(`<text class="fp-name fp-strong" x="${g.W / 2}" y="${y0 + w.h + 28}" text-anchor="middle" style="font-size:14px">↔ ${esc(conn)}</text>`);
      H = y0 + w.h + 44;
    }
  }
  return `<svg class="fp-svg" viewBox="0 0 ${g.W} ${H}" role="group" aria-label="${esc(T.aria)}">${out.join('')}</svg>`;
}

export function steps(s: ChainState, lang: Lang): StepText[] {
  return CHAIN(lang).steps(derive(s.lab, s.v));
}
export function renderDesc(s: ChainState, lang: Lang): string {
  const st = steps(s, lang)[s.step];
  const ps = st.ps.map((p) => `<p>${esc(p)}</p>`).join('');
  const res = st.result ? `<p class="fp-result ${st.bad ? 'bad' : ''}">${esc(st.result)}</p>` : '';
  return `<h4 class="fp-h">${esc(st.h)}</h4>${ps}${res}`;
}
export function hint(s: ChainState, lang: Lang): string {
  const T = CHAIN(lang);
  return s.sel ? T.hintNode(s.sel, T.valName[s.lab[s.sel]]) : T.hintIdle;
}
export const caption = (s: ChainState, lang: Lang) => CHAIN(lang).caption(s.step, derive(s.lab, s.v));

export const chainModel: FlpModel<ChainState> = {
  kind: 'chain',
  lastStep: () => LAST,
  init: () => ({ step: 0, lab: exampleLab(), v: '1', sel: null }),
  render: (s, mode, lang) => ({ svg: renderSvg(s, mode, lang), desc: renderDesc(s, lang), hint: hint(s, lang), caption: caption(s, lang) }),
  progress: (s, lang) => C(lang).progress(s.step + 1, LAST + 1),
  onHit: (s, hit) => {
    if (!ORDER.includes(hit)) return false;
    s.sel = hit;
    s.lab[hit] = cycle[s.lab[hit]];
    return true;
  },
  onAct: (s, act) => {
    if (act === 'random') { s.lab = randomLab(); return true; }
    if (act === 'example') { s.lab = exampleLab(); return true; }
    if (act === 'clear') { s.lab = emptyLab(); s.sel = null; return true; }
    if (act === 'v0') { s.v = '0'; return true; }
    if (act === 'v1') { s.v = '1'; return true; }
    return false;
  },
  sync: (root, s) => {
    root.querySelectorAll<HTMLElement>('[data-v]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === s.v)));
    const dec = root.querySelector<HTMLElement>('[data-decide]');
    if (dec) dec.hidden = s.step < 2;
  },
  detail: (s) => ({ lab: { ...s.lab }, info: derive(s.lab, s.v), step: s.step }),
};
