/**
 * FLM 覆蓋圖互動圖的共用控制器：步進、滑過／聚焦節點、點節點填決定、隨機填、窄螢幕切換上下堆疊。
 * 各圖（三角形、牆）只要提供 Model：怎麼畫 SVG、怎麼寫說明。
 */
import { ctStrings, type Lang } from './strings';
import { bindStepper } from '../stepper';

export type Dec = '?' | '0' | '1';
export type Mode = 'wide' | 'tall';
export interface CtState {
  step: number;
  dec: Record<string, Dec>;
  sel: string | null;
  /** 加上不可偽造簽章（拿掉 Fault 公理） */
  signed: boolean;
  /** 每個圓代表的節點數（只有三角形圖用） */
  m: number;
}
export interface Model {
  kind: string;
  features: { signed: boolean; m: boolean };
  lastStep: number;
  nodes: string[];
  emptyDecisions: () => Record<string, Dec>;
  renderSvg: (s: CtState, mode: Mode, lang: Lang) => string;
  renderDesc: (s: CtState, lang: Lang) => string;
  hintText: (s: CtState, lang: Lang) => string;
}

const cycle: Record<Dec, Dec> = { '?': '0', '0': '1', '1': '?' };

export function mount(root: HTMLElement, model: Model) {
  const lang = root.dataset.lang as Lang;
  const t = ctStrings[lang];
  const fig = root.querySelector<HTMLElement>('[data-fig]')!;
  const desc = root.querySelector<HTMLElement>('[data-desc]')!;
  const hint = root.querySelector<HTMLElement>('[data-hint]')!;
  const btn = (a: string) => root.querySelector<HTMLButtonElement>(`[data-act="${a}"]`)!;
  const random = btn('random'), clear = btn('clear');
  const LAST = model.lastStep;

  const state: CtState = { step: 0, dec: model.emptyDecisions(), sel: null, signed: false, m: 1 };
  const signBox = root.querySelector<HTMLElement>('[data-sign]')!;
  const signInput = signBox.querySelector<HTMLInputElement>('input')!;
  const mBox = root.querySelector<HTMLElement>('[data-m]')!;
  const mVal = mBox.querySelector<HTMLElement>('[data-mval]')!;
  const modeNow = (): Mode => (root.clientWidth >= 600 ? 'wide' : 'tall');
  let mode = modeNow();

  function draw(refocus?: string | null) {
    mode = modeNow();
    fig.innerHTML = model.renderSvg(state, mode, lang);
    desc.innerHTML = model.renderDesc(state, lang);
    hint.textContent = model.hintText(state, lang);
    root.dataset.mode = mode;
    stepper.sync(t.progress(state.step + 1, LAST + 1), desc.querySelector('.ct-h')?.textContent ?? '');
    random.hidden = clear.hidden = state.step < 3;
    signBox.hidden = !(model.features.signed && state.step >= 4 && state.step <= 7);
    signInput.checked = state.signed;
    mBox.hidden = !model.features.m;
    mVal.textContent = String(state.m);
    document.dispatchEvent(new CustomEvent('flm-dec', { detail: { kind: model.kind, dec: { ...state.dec } } }));
    if (refocus) fig.querySelector<SVGElement>(`[data-node="${refocus}"]`)?.focus();
  }
  const focusedNode = () => (document.activeElement as HTMLElement | null)?.closest?.('[data-node]')?.getAttribute('data-node') ?? null;
  const stepper = bindStepper(root, {
    step: () => state.step,
    setStep: (n) => { state.step = n; if (n < 2) state.sel = null; },
    last: () => LAST,
    redraw: () => draw(),
  });

  signInput.addEventListener('change', () => { state.signed = signInput.checked; draw(); });
  mBox.querySelector('[data-act="m-"]')!.addEventListener('click', () => { state.m = Math.max(1, state.m - 1); draw(); });
  mBox.querySelector('[data-act="m+"]')!.addEventListener('click', () => { state.m = Math.min(3, state.m + 1); draw(); });
  clear.addEventListener('click', () => { state.dec = model.emptyDecisions(); draw(); });
  random.addEventListener('click', () => {
    for (const n of model.nodes) state.dec[n] = Math.random() < 0.5 ? '0' : '1';
    draw();
  });

  const nodeOf = (e: Event) => (e.target as Element).closest?.('[data-node]')?.getAttribute('data-node');
  const pick = (n: string, toggle: boolean) => {
    state.sel = n;
    if (toggle && state.step >= 3) state.dec[n] = cycle[state.dec[n]];
    draw(n);
  };
  fig.addEventListener('pointerover', (e) => {
    const n = nodeOf(e);
    if (!n || state.step < 2 || state.sel === n) return;
    state.sel = n;
    draw(focusedNode());
  });
  fig.addEventListener('mouseleave', () => {
    if (state.sel && !focusedNode()) { state.sel = null; draw(); }
  });
  fig.addEventListener('click', (e) => {
    const n = nodeOf(e);
    if (n && state.step >= 2) pick(n, true);
  });
  fig.addEventListener('focusin', (e) => {
    const n = nodeOf(e);
    if (n && state.sel !== n) { state.sel = n; draw(n); }
  });
  fig.addEventListener('keydown', (e) => {
    const n = nodeOf(e);
    if (n && (e.key === 'Enter' || e.key === ' ') && state.step >= 2) { e.preventDefault(); pick(n, true); }
  });
  new ResizeObserver(() => { if (modeNow() !== mode) draw(focusedNode()); }).observe(root);

  draw();
}
