/**
 * 步進圖共用的步進邏輯（FLM、FLP 的 controller 都用這一份）：
 * 上一步／下一步按鈕、←／→ 鍵、自動播放、列印時顯示結論畫面。
 * 各圖的 controller 只負責「畫」；步進與播放的狀態機在這裡。
 * 標記由 StepBar.astro 提供（data-act=prev|next|play、data-progress、data-caption）。
 */
export interface StepperOpts {
  step: () => number;
  setStep: (n: number) => void;
  last: () => number;
  /** 步數改變後要重畫（controller 的 draw） */
  redraw: () => void;
  /** 自動播放每步的毫秒數；沒有就不提供播放 */
  playMs?: number;
  /** 一般按鈕按下時呼叫（停止播放）以外，使用者點了上一步／下一步／方向鍵時也會呼叫 */
  onNav?: () => void;
}

export function bindStepper(root: HTMLElement, o: StepperOpts) {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s);
  const prev = q<HTMLButtonElement>('[data-act="prev"]')!;
  const next = q<HTMLButtonElement>('[data-act="next"]')!;
  const play = q<HTMLButtonElement>('[data-act="play"]');
  const progress = q<HTMLElement>('[data-progress]')!;
  const caption = q<HTMLElement>('[data-caption]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = 0;

  const clamp = (n: number) => Math.max(0, Math.min(o.last(), n));
  const stop = () => {
    if (timer) { clearInterval(timer); timer = 0; }
    if (play) play.textContent = play.dataset.labelPlay ?? '';
  };
  const go = (d: number) => { o.setStep(clamp(o.step() + d)); o.redraw(); };
  const nav = (d: number) => { stop(); o.onNav?.(); go(d); };

  prev.addEventListener('click', () => nav(-1));
  next.addEventListener('click', () => nav(1));
  play?.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (o.step() >= o.last()) o.setStep(0);
    play.textContent = play.dataset.labelPause ?? '';
    o.redraw();
    timer = window.setInterval(() => {
      if (o.step() >= o.last()) { stop(); o.redraw(); return; }
      go(1);
    }, o.playMs);
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); nav(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); nav(-1); }
  });

  // 列印（或存成 PDF）時固定顯示最後一步的結論畫面，列印完回到原來的步數。
  let saved: number | null = null;
  window.addEventListener('beforeprint', () => {
    stop();
    saved = o.step();
    o.setStep(o.last());
    o.redraw();
  });
  window.addEventListener('afterprint', () => {
    if (saved === null) return;
    o.setStep(saved);
    saved = null;
    o.redraw();
  });

  return {
    /** 每次重畫後呼叫：更新步數文字、標題、按鈕狀態 */
    sync(progressText: string, captionText?: string) {
      progress.textContent = progressText;
      if (caption && captionText !== undefined) caption.textContent = captionText;
      prev.hidden = next.hidden = false;
      prev.disabled = o.step() === 0;
      next.disabled = o.step() >= o.last();
      if (play) { play.hidden = reduce || !o.playMs; play.disabled = o.step() >= o.last() && !timer; }
    },
    stop,
  };
}
