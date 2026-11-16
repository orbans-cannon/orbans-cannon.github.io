/**
 * 圖 B（引理 3）：反證假設 𝒟 全是 univalent，找到相鄰的 C₀、C₁ 之後分兩種情形。
 * 讀者選相鄰那一步 e′ 是別人做的還是 p 自己做的；圖逐步畫出矛盾。
 * v2：每一步只讓用得到的部分保持清楚（其餘淡出）；三種步驟用線條樣式區分（粗線 e、細線 e′、虛線 σ）。
 */
import { arrow, edgeLabel, esc, f1, link, valSym, type Lang, type Mode, type Pt, type Val } from './symbols';
import { CASES, C, type StepText } from './strings';
import type { FlpModel } from './controller';

export type Case = 'ne' | 'eq';
export interface CasesState { step: number; c: Case }
export const lastStep = (c: Case) => (c === 'ne' ? 3 : 6);

type Name = 'C' | 'C0' | 'C1' | 'A' | 'A1' | 'D0' | 'D1' | 'E0' | 'E1';
type Kind = 'e' | 'ep' | 'sig';
type Arr = 'C0-C1' | 'C0-D0' | 'C1-D1' | 'D0-D1' | 'C0-A' | 'D0-E0' | 'D1-E1' | 'A-A1' | 'A-E0' | 'A1-E1';
const ARR: Record<Arr, { a: Name; b: Name; kind: Kind; text: string }> = {
  'C0-C1': { a: 'C0', b: 'C1', kind: 'ep', text: 'e′' },
  'C0-D0': { a: 'C0', b: 'D0', kind: 'e', text: 'e' },
  'C1-D1': { a: 'C1', b: 'D1', kind: 'e', text: 'e' },
  'D0-D1': { a: 'D0', b: 'D1', kind: 'ep', text: 'e′' },
  'C0-A': { a: 'C0', b: 'A', kind: 'sig', text: 'σ' },
  'D0-E0': { a: 'D0', b: 'E0', kind: 'sig', text: 'σ' },
  'D1-E1': { a: 'D1', b: 'E1', kind: 'sig', text: 'σ' },
  'A-A1': { a: 'A', b: 'A1', kind: 'ep', text: 'e′' },
  'A-E0': { a: 'A', b: 'E0', kind: 'e', text: 'e' },
  'A1-E1': { a: 'A1', b: 'E1', kind: 'e', text: 'e' },
};

interface G { W: number; H: number; r: number; pts: Record<Name, Pt>; cloudC: [number, number, number, number]; cloudD: [number, number, number, number]; tC: Pt; tD: Pt }
function geom(mode: Mode): G {
  if (mode === 'wide') {
    return {
      W: 720, H: 318, r: 19,
      pts: { C: { x: 48, y: 200 }, C0: { x: 130, y: 130 }, C1: { x: 130, y: 250 }, A: { x: 225, y: 86 }, A1: { x: 225, y: 206 }, D0: { x: 500, y: 130 }, D1: { x: 500, y: 250 }, E0: { x: 595, y: 86 }, E1: { x: 595, y: 206 } },
      cloudC: [14, 34, 290, 268], cloudD: [420, 34, 290, 268], tC: { x: 24, y: 56 }, tD: { x: 430, y: 56 },
    };
  }
  return {
    W: 360, H: 604, r: 15,
    pts: { C: { x: 40, y: 215 }, C0: { x: 100, y: 100 }, C1: { x: 240, y: 100 }, A: { x: 150, y: 180 }, A1: { x: 290, y: 180 }, D0: { x: 100, y: 400 }, D1: { x: 240, y: 400 }, E0: { x: 150, y: 480 }, E1: { x: 290, y: 480 } },
    cloudC: [10, 30, 340, 250], cloudD: [10, 330, 340, 250], tC: { x: 20, y: 52 }, tD: { x: 20, y: 352 },
  };
}
const NAME: Record<Name, string> = { C: 'C', C0: 'C₀', C1: 'C₁', A: 'A', A1: 'A′', D0: 'D₀', D1: 'D₁', E0: 'E₀', E1: 'E₁' };

interface Vis { nodes: Name[]; arrows: Arr[]; fNodes: Name[]; fArrows: Arr[]; fresh: Arr[] }
const BASE: Arr[] = ['C0-C1', 'C0-D0', 'C1-D1'];
const N5: Name[] = ['C', 'C0', 'C1', 'D0', 'D1'];
export function visOf(c: Case, step: number): Vis {
  if (c === 'ne') {
    const arrows: Arr[] = step >= 1 ? [...BASE, 'D0-D1'] : BASE;
    const f = [
      { n: N5, a: arrows },
      { n: ['C0', 'C1', 'D0', 'D1'] as Name[], a: arrows },
      { n: ['D0', 'D1'] as Name[], a: ['D0-D1'] as Arr[] },
      { n: ['D0', 'D1'] as Name[], a: ['D0-D1'] as Arr[] },
    ][step];
    return { nodes: N5, arrows, fNodes: f.n, fArrows: f.a, fresh: step === 1 ? ['D0-D1'] : [] };
  }
  const nodes: Name[] = [...N5];
  const arrows: Arr[] = [...BASE];
  const fresh: Arr[] = [];
  if (step >= 1) { nodes.push('A'); arrows.push('C0-A'); if (step === 1) fresh.push('C0-A'); }
  if (step >= 2) { nodes.push('E0', 'E1'); arrows.push('D0-E0', 'D1-E1'); if (step === 2) fresh.push('D0-E0', 'D1-E1'); }
  if (step >= 3) { arrows.push('A-E0'); if (step === 3) fresh.push('A-E0'); }
  if (step >= 4) { nodes.push('A1'); arrows.push('A-A1', 'A1-E1'); if (step === 4) fresh.push('A-A1', 'A1-E1'); }
  const f = [
    { n: N5, a: BASE },
    { n: ['C0', 'A'] as Name[], a: ['C0-A'] as Arr[] },
    { n: ['D0', 'D1', 'E0', 'E1'] as Name[], a: ['D0-E0', 'D1-E1'] as Arr[] },
    { n: ['A', 'E0'] as Name[], a: ['A-E0'] as Arr[] },
    { n: ['A', 'A1', 'E1'] as Name[], a: ['A-A1', 'A1-E1'] as Arr[] },
    { n: ['A', 'A1', 'E0', 'E1'] as Name[], a: ['A-E0', 'A-A1', 'A1-E1'] as Arr[] },
    { n: ['A', 'A1', 'E0', 'E1'] as Name[], a: ['A-E0', 'A-A1', 'A1-E1'] as Arr[] },
  ][step];
  return { nodes, arrows, fNodes: f.n, fArrows: f.a, fresh };
}

export function renderSvg(s: CasesState, mode: Mode, lang: Lang): string {
  const g = geom(mode);
  const T = CASES(lang);
  const small = mode === 'tall';
  const P = g.pts;
  const r = g.r;
  const v = visOf(s.c, s.step);
  const out: string[] = [];
  const eq = s.c === 'eq';
  const st = s.step;
  const fs = small ? 11 : 13;

  const cloud = (b: [number, number, number, number], t: Pt, title: string) =>
    `<rect class="fp-cloud" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="14"/><text class="fp-cloud-t" x="${t.x}" y="${t.y}" style="font-size:${small ? 11 : 12.5}px">${esc(title)}</text>`;
  out.push(cloud(g.cloudC, g.tC, T.cloudC), cloud(g.cloudD, g.tD, T.cloudD));

  const lbl = (a: Pt, b: Pt, text: string, kind: Kind, dim: boolean) => {
    const off = kind === 'e' ? (small ? -13 : -11) : kind === 'ep' ? (small ? -11 : 13) : -12;
    return `<g class="${dim ? 'fp-dim' : ''}">${edgeLabel(a, b, text, off, 'k')}</g>`;
  };
  // 虛線連結：C 到 C₀（C 在 𝒞 裡）
  out.push(`<g class="${v.fNodes.includes('C') ? '' : 'fp-dim'}">${link(P.C, P.C0, '', r, r)}</g>`);

  const badArrow = !eq && st >= 2;
  for (const k of v.arrows) {
    const a = ARR[k];
    const dim = !v.fArrows.includes(k);
    const cls = `k-${a.kind} ${v.fresh.includes(k) ? 'fp-new' : ''} ${badArrow && k === 'D0-D1' ? 'fp-bad' : ''}`;
    out.push(`<g class="${dim ? 'fp-dim' : ''}">${arrow(P[a.a], P[a.b], cls, r + 1, r + 3)}</g>` + lbl(P[a.a], P[a.b], a.text, a.kind, dim));
  }

  const val: Record<Name, Val> = {
    C: 'B', C0: '?', C1: '?', D0: '0', D1: '1', E0: '0', E1: '1',
    A: eq && st >= 5 ? 'B' : '?',
    A1: '?',
  };
  const badNode: Partial<Record<Name, boolean>> = { D1: !eq && st >= 2, A: eq && st >= 6 };
  for (const n of v.nodes) {
    const p = P[n];
    const dim = !v.fNodes.includes(n);
    const o: string[] = [valSym(p, r, val[n], badNode[n] ? 'fv-bad' : '')];
    o.push(`<text class="fp-name" x="${f1(p.x - 4)}" y="${f1(p.y - r - 5)}" text-anchor="end" style="font-size:${fs}px">${NAME[n]}</text>`);
    if (n === 'A' && st >= 1 && st <= 4) o.push(`<text class="fp-note" x="${f1(p.x)}" y="${f1(p.y + r + 15)}" text-anchor="middle" style="font-size:${small ? 10.5 : 12}px">${esc(T.deciding)}</text>`);
    if (badNode[n]) o.push(`<text class="fp-x" x="${f1(p.x + r + 5)}" y="${f1(p.y + 6)}">✗</text>`);
    out.push(`<g class="${dim ? 'fp-dim' : ''}">${o.join('')}</g>`);
  }
  if (!eq && st >= 2) {
    const q = P.D1;
    out.push(`<text class="fp-note fp-bad" x="${f1(q.x + (small ? -8 : 0))}" y="${f1(q.y + r + 22)}" text-anchor="${small ? 'start' : 'middle'}" style="font-size:${small ? 10.5 : 12}px">${esc(T.conflict)}</text>`);
  }
  if (eq && st >= 6) {
    const q = P.A;
    out.push(`<text class="fp-note fp-bad" x="${f1(q.x + (small ? -6 : r + 24))}" y="${f1(q.y + (small ? -r - 22 : -r - 8))}" text-anchor="start" style="font-size:${small ? 10.5 : 12}px">${esc(T.mustUni)}</text>`);
  }
  return `<svg class="fp-svg" viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="${esc(T.aria)}">${out.join('')}</svg>`;
}

export const stepsOf = (c: Case, lang: Lang): StepText[] => (c === 'ne' ? CASES(lang).stepsNe : CASES(lang).stepsEq);
export const captionOf = (s: CasesState, lang: Lang) => (s.c === 'ne' ? CASES(lang).capNe : CASES(lang).capEq)[s.step];

export function renderDesc(s: CasesState, lang: Lang): string {
  const st = stepsOf(s.c, lang)[s.step];
  const ps = st.ps.map((p) => `<p>${esc(p)}</p>`).join('');
  const res = st.result ? `<p class="fp-result ${st.bad ? 'bad' : ''}">${esc(st.result)}</p>` : '';
  return `<h4 class="fp-h">${esc(st.h)}</h4>${ps}${res}`;
}

export const casesModel: FlpModel<CasesState> = {
  kind: 'cases',
  lastStep: (s) => lastStep(s.c),
  init: () => ({ step: 0, c: 'ne' }),
  render: (s, mode, lang) => ({ svg: renderSvg(s, mode, lang), desc: renderDesc(s, lang), hint: CASES(lang).hintIdle, caption: captionOf(s, lang) }),
  progress: (s, lang) => C(lang).progress(s.step + 1, lastStep(s.c) + 1),
  onAct: (s, act) => {
    if (act === 'case-ne' || act === 'case-eq') {
      s.c = act === 'case-ne' ? 'ne' : 'eq';
      s.step = Math.min(s.step, lastStep(s.c));
      return true;
    }
    return false;
  },
  sync: (root, s) => {
    root.querySelectorAll<HTMLElement>('[data-case]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.case === s.c)));
  },
  detail: (s) => ({ case: s.c, step: s.step }),
};
