/** 證明裡的小標籤：依互動圖送出的 `flp-val` 事件，算出每個標籤要顯示的字。 */
import { CHIPS } from './strings';
import type { Lang } from './symbols';

export interface Chip { text: string; bad: boolean }
type Detail = Record<string, any>;

export function chipText(key: string, d: Record<string, Detail | undefined>, lang: Lang): Chip | null {
  const T = CHIPS(lang);
  const [kind, id] = key.split('.');
  const x = d[kind];
  if (!x) return null;
  if (kind === 'chain') {
    const info = x.info;
    if (id === 'counts') {
      if (info.n0 + info.n1 + info.nb === 0) return null;
      const ok = info.n0 >= 1 && info.n1 >= 1;
      return { text: `${T.yours}：${T.counts(info.n0, info.n1, info.nb)} ${ok ? '✓' : '✗'}`, bad: !ok };
    }
    if (!info.pair) return null;
    if (id === 'pair') return { text: `${T.yours}：${T.pair(info.pair.c0, info.pair.c1, info.pair.p)}`, bad: false };
    if (id === 'decide') return x.step >= 2 ? { text: T.decide(info.v), bad: false } : null;
    if (id === 'contra') return x.step >= 3 ? { text: T.contra(info.v, info.v === '1' ? 'C₀' : 'C₁'), bad: true } : null;
  }
  if (kind === 'cases') {
    if (id === x.case) return { text: T.caseNow, bad: false };
    return null;
  }
  if (kind === 'stages') {
    if (x.step < 1) return null;
    if (id === 'nodecide') return { text: T.stages(x.step), bad: false };
    if (id === 'sched') {
      if (x.sched === 'fair') return { text: T.sched.fair, bad: false };
      return { text: T.sched.withhold('m1', x.withheldTo), bad: true };
    }
  }
  return null;
}
