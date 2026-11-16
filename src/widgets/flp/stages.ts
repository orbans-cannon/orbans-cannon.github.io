/**
 * 圖 C：引理 3 建構出來的永遠不決定的執行。
 * 上面：一路停在「兩種結局都還有可能」的路徑，每個階段旁邊畫一個被繞開的危險一步；
 * 下面：每個階段輪到誰收最早的訊息（公平）。另有「扣住一則訊息」的開關說明什麼不算容許執行。
 * 協議本身是示意：每個 process 走一步就送一則訊息給下一個 process；階段中間其他 process 的步驟省略。
 */
import { esc, f1, sub, valSym, type Lang, type Mode } from './symbols';
import { STAGES, C } from './strings';
import type { FlpModel } from './controller';

export type Sched = 'fair' | 'withhold';
export interface StagesState { step: number; sched: Sched }
export const MAX = 8;
export const SSR_STEP = 6;
const N = 3;

export interface Msg { id: number; from: number; to: number; sent: number; recv: number | null }
export interface Ev { stage: number; proc: number; recv: number | null }
export interface Sim { evs: Ev[]; msgs: Msg[]; withheld: number | null }

export function simulate(sched: Sched, stages: number): Sim {
  const msgs: Msg[] = [];
  let nextId = 1;
  for (let i = 0; i < N; i++) msgs.push({ id: nextId++, from: i, to: (i + 1) % N, sent: 0, recv: null });
  const withheld = sched === 'withhold' ? 1 : null;
  const earliest = (to: number) => msgs.find((m) => m.to === to && m.recv === null && m.id !== withheld) ?? null;
  const evs: Ev[] = [];
  for (let k = 1; k <= stages; k++) {
    const head = (k - 1) % N;
    const m = earliest(head);
    if (m) m.recv = k;
    msgs.push({ id: nextId++, from: head, to: (head + 1) % N, sent: k, recv: null });
    evs.push({ stage: k, proc: head, recv: m ? m.id : null });
  }
  return { evs, msgs, withheld };
}

const P = (i: number) => `p${sub(i + 1)}`;
const WIG = [0, 18, -14, 20, -16, 18, -12, 20, -14];

interface G { W: number; x0: number; x1: number; zone0: [number, number]; band: [number, number]; zone1: [number, number]; mid: number; amp: number; yLab: number; yHead: number; yRow: (i: number) => number; rowGap: number; H: number }
function geom(mode: Mode): G {
  if (mode === 'wide') {
    return { W: 720, x0: 120, x1: 704, zone0: [20, 54], band: [58, 172], zone1: [176, 210], mid: 117, amp: 1.2, yLab: 232, yHead: 264, yRow: (i) => 292 + i * 30, rowGap: 30, H: 292 + 2 * 30 + 52 };
  }
  return { W: 360, x0: 64, x1: 352, zone0: [14, 44], band: [48, 150], zone1: [154, 184], mid: 102, amp: 1, yLab: 204, yHead: 234, yRow: (i) => 258 + i * 28, rowGap: 28, H: 258 + 2 * 28 + 50 };
}

export function renderSvg(s: StagesState, mode: Mode, lang: Lang): string {
  const T = STAGES(lang);
  const g = geom(mode);
  const small = mode === 'tall';
  const sim = simulate(s.sched, s.step);
  const colW = (g.x1 - g.x0) / MAX;
  const fs = (a: number, b: number) => `font-size:${small ? a : b}px`;
  const out: string[] = [];
  const W = g.W;
  const fair = s.sched === 'fair';

  // 目前階段的欄
  if (s.step >= 1) out.push(`<rect class="fc-col" x="${f1(g.x0 + (s.step - 1) * colW)}" y="${g.zone0[0]}" width="${f1(colW)}" height="${f1(g.yRow(2) + 20 - g.zone0[0])}" rx="6"/>`);

  // 上面：兩個出口與中間的未定區
  const zoneY = (z: [number, number], v: '0' | '1', text: string) =>
    `<g><rect class="fc-zone" x="8" y="${z[0]}" width="${W - 16}" height="${z[1] - z[0]}" rx="8"/>${valSym({ x: 28, y: (z[0] + z[1]) / 2 }, small ? 8 : 9, v)}<text class="fp-name" x="${small ? 44 : 46}" y="${f1((z[0] + z[1]) / 2 + 4.5)}" style="${fs(11.5, 13)}">${esc(text)}</text></g>`;
  const dimBand = fair ? '' : 'fp-dim';
  out.push(`<g class="${dimBand}">${zoneY(g.zone0, '0', T.zone0)}${zoneY(g.zone1, '1', T.zone1)}`);
  out.push(`<rect class="fc-band" x="8" y="${g.band[0]}" width="${W - 16}" height="${g.band[1] - g.band[0]}" rx="8"/>`);
  out.push(`<text class="fp-note" x="${small ? 14 : 16}" y="${g.band[0] + (small ? 15 : 17)}" style="${fs(10.5, 12)}">${esc(small ? T.band2 : T.band1 + T.band2)}</text></g>`);

  if (fair) {
    const pt = (k: number) => ({ x: g.x0 + k * colW, y: g.mid + WIG[k % WIG.length] * g.amp });
    // 危險的一步：從上一個點往出口，會把結果定下來
    for (let k = 1; k <= s.step; k++) {
      const a = pt(k - 1);
      const up = k % 2 === 0;
      const ex = a.x + colW * 0.46, ey = up ? g.band[0] + 3 : g.band[1] - 3;
      out.push(`<line class="fc-danger" x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(ex)}" y2="${f1(ey)}"/>`);
      out.push(`<text class="fc-dx" x="${f1(ex - 4)}" y="${f1(ey + (up ? 16 : -5))}" style="font-size:16px">✗</text>`);
      if (k === s.step && !small) out.push(`<text class="fp-note" x="${f1(ex + 14)}" y="${f1(ey + (up ? 17 : -6))}" style="font-size:12px">${esc(T.danger)}</text>`);
    }
    const pts = Array.from({ length: s.step + 1 }, (_, k) => pt(k));
    out.push(`<polyline class="fc-path" points="${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')}"/>`);
    pts.forEach((p) => out.push(valSym(p, small ? 5.5 : 7, 'B')));
  } else {
    out.push(`<text class="fp-note fp-bad" x="${f1((g.x0 + g.x1) / 2)}" y="${g.mid + 4}" text-anchor="middle" style="${fs(10.5, 12.5)}">${esc(T.withholdNote)}</text>`);
  }

  // 階段標籤
  for (let k = 1; k <= MAX; k++) {
    out.push(`<text class="fc-colh" x="${f1(g.x0 + (k - 0.5) * colW)}" y="${g.yLab}" text-anchor="middle" style="${fs(10, 11.5)};opacity:${k <= s.step ? 1 : 0.4}">${small ? k : esc(T.stageLbl(k))}</text>`);
  }

  // 下面：每個階段輪到誰
  out.push(`<text class="fp-name fp-strong" x="12" y="${g.yHead}" style="${fs(11.5, 13)}">${esc(T.turnsTitle)}</text>`);
  for (let i = 0; i < N; i++) {
    const y = g.yRow(i);
    const redRow = !fair && i === 1;
    out.push(`<line class="fc-rowline" x1="${g.x0}" y1="${y}" x2="${g.x1}" y2="${y}"/>`);
    out.push(`<text class="fa-bit ${redRow ? 'diff' : ''}" x="${g.x0 - 14}" y="${y + 4.5}" text-anchor="end" style="${redRow ? 'fill:var(--bft-fault);font-weight:700;' : ''}${fs(11.5, 13)}">${P(i)}</text>`);
    for (let k = 1; k <= MAX; k++) {
      const cx = g.x0 + (k - 0.5) * colW;
      const turn = k <= s.step && (k - 1) % N === i;
      out.push(turn ? `<circle class="fc-turn" cx="${f1(cx)}" cy="${y}" r="${small ? 6.5 : 8.5}"/>` : `<circle class="fc-wait" cx="${f1(cx)}" cy="${y}" r="2.4"/>`);
    }
  }
  if (!fair) out.push(`<text class="fp-note fp-bad" x="${f1(W / 2)}" y="${g.yRow(2) + 30}" text-anchor="middle" style="${fs(10.5, 12.5)}">${esc(T.withholdMsg('m1', P(1)))}</text>`);

  return `<svg class="fp-svg" viewBox="0 0 ${W} ${g.H}" role="img" aria-label="${esc(T.aria)}">${out.join('')}</svg>`;
}

export function renderDesc(s: StagesState, lang: Lang): string {
  const T = STAGES(lang);
  const sim = simulate(s.sched, s.step);
  const out: string[] = [`<h4 class="fp-h">${esc(T.heading(s.step))}</h4>`, `<p>${esc(T.intro)}</p>`, '<ul class="fp-rows">'];
  const cnt = Array.from({ length: N }, (_, i) => sim.evs.filter((e) => e.proc === i).length);
  out.push(`<li><span class="fp-k">${esc(T.turns)}</span><span class="fp-chips">${cnt.map((c, i) => `<span class="fp-chip">${esc(T.turnsOf(P(i), c))}</span>`).join('')}</span></li>`);
  const pend = sim.msgs.filter((m) => m.recv === null);
  const chips = pend.length
    ? pend.map((m) => `<span class="fp-chip ${sim.withheld === m.id ? 'bad' : ''}">m${m.id} ${P(m.from)}→${P(m.to)}，${esc(T.waited(s.step - m.sent))}</span>`).join('')
    : `<span class="fp-chip">${esc(T.bufferEmpty)}</span>`;
  out.push(`<li><span class="fp-k">${esc(T.pending)}</span><span class="fp-chips">${chips}</span></li></ul>`);
  const withhold = s.sched === 'withhold';
  out.push(`<p class="fp-result ${withhold ? 'bad' : ''}">${esc(withhold ? T.verdictWithhold('m1', P(1)) : T.verdictFair)}</p>`);
  if (!withhold) out.push(`<p>${esc(T.noteStop)}</p>`);
  return out.join('');
}

export const caption = (s: StagesState, lang: Lang) => {
  const T = STAGES(lang);
  return s.sched === 'fair' ? T.caption(s.step, P((s.step - 1 + N) % N)) : T.captionW(s.step);
};

export const stagesModel: FlpModel<StagesState> = {
  kind: 'stages',
  playMs: 900,
  lastStep: () => MAX,
  init: () => ({ step: 0, sched: 'fair' }),
  render: (s, mode, lang) => ({ svg: renderSvg(s, mode, lang), desc: renderDesc(s, lang), hint: STAGES(lang).hintIdle, caption: caption(s, lang) }),
  progress: (s, lang) => C(lang).progress(s.step, MAX),
  onAct: (s, act) => {
    if (act === 'reset') { s.step = 0; return true; }
    if (act === 'withhold') { s.sched = s.sched === 'fair' ? 'withhold' : 'fair'; return true; }
    return false;
  },
  sync: (root, s) => {
    const b = root.querySelector<HTMLElement>('[data-act="withhold"]');
    if (b) b.setAttribute('aria-pressed', String(s.sched === 'withhold'));
  },
  detail: (s) => ({ sched: s.sched, step: s.step, withheldTo: P(1), nodecide: true }),
};
