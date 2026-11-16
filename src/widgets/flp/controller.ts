/**
 * FLP 互動圖的共用控制器：步進、方向鍵、重畫、窄螢幕切換上下堆疊、自動播放。
 * 各圖提供一個 Model：怎麼畫、怎麼回應點擊與按鈕。重畫後送出 `flp-val` 事件，證明裡的小標籤（FlpCheck）據此更新。
 */
import type { Lang, Mode } from './symbols';
import { bindStepper } from '../stepper';

export interface Rendered { svg: string; desc: string; hint: string; caption?: string }
export interface FlpModel<S extends { step: number }> {
  kind: string;
  lastStep: (s: S) => number;
  init: () => S;
  render: (s: S, mode: Mode, lang: Lang) => Rendered;
  progress: (s: S, lang: Lang) => string;
  /** 點到圖上有 data-hit 的元素；回傳 true 表示要重畫 */
  onHit?: (s: S, hit: string) => boolean;
  /** 按到 data-act 的按鈕，或 data-sel 的下拉選單（act 形如 `sel:名稱`） */
  onAct?: (s: S, act: string, value?: string) => boolean;
  /** 重畫後更新額外控制項（顯示／停用／數值） */
  sync?: (root: HTMLElement, s: S) => void;
  detail: (s: S) => unknown;
  /** 自動播放每步的毫秒數；沒有就不提供播放 */
  playMs?: number;
}

export function mount<S extends { step: number }>(root: HTMLElement, model: FlpModel<S>) {
  const lang = root.dataset.lang as Lang;
  const fig = root.querySelector<HTMLElement>('[data-fig]')!;
  const desc = root.querySelector<HTMLElement>('[data-desc]')!;
  const hint = root.querySelector<HTMLElement>('[data-hint]')!;
  const state = model.init();
  const modeNow = (): Mode => (root.clientWidth >= 600 ? 'wide' : 'tall');
  let mode = modeNow();
  const stepper = bindStepper(root, {
    step: () => state.step,
    setStep: (n) => { state.step = n; },
    last: () => model.lastStep(state),
    redraw: () => draw(),
    playMs: model.playMs,
  });
  const stop = stepper.stop;

  function draw(refocus?: string | null) {
    mode = modeNow();
    const r = model.render(state, mode, lang);
    fig.innerHTML = r.svg;
    desc.innerHTML = r.desc;
    hint.textContent = r.hint;
    root.dataset.mode = mode;
    stepper.sync(model.progress(state, lang), r.caption ?? '');
    model.sync?.(root, state);
    document.dispatchEvent(new CustomEvent('flp-val', { detail: { kind: model.kind, ...(model.detail(state) as object) } }));
    if (refocus) fig.querySelector<SVGElement>(`[data-hit="${refocus}"]`)?.focus();
  }
  root.querySelectorAll<HTMLElement>('[data-act]').forEach((el) => {
    const a = el.dataset.act!;
    if (a === 'prev' || a === 'next' || a === 'play') return;
    el.addEventListener('click', () => { stop(); if (model.onAct?.(state, a)) draw(); });
  });
  root.querySelectorAll<HTMLSelectElement>('select[data-sel]').forEach((el) => {
    el.addEventListener('change', () => { stop(); if (model.onAct?.(state, 'sel:' + el.dataset.sel, el.value)) draw(); });
  });

  const hitOf = (e: Event) => (e.target as Element).closest?.('[data-hit]')?.getAttribute('data-hit') ?? null;
  fig.addEventListener('click', (e) => {
    const h = hitOf(e);
    if (h && model.onHit?.(state, h)) draw(h);
  });
  fig.addEventListener('keydown', (e) => {
    const h = hitOf(e);
    if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (model.onHit?.(state, h)) draw(h); }
  });
  new ResizeObserver(() => { if (modeNow() !== mode) draw(); }).observe(root);

  draw();
}
