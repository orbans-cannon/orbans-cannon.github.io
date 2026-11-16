/**
 * 執行追蹤與反例共用的型別、標籤與檢查。
 * 檢查對應作者「精確敘述訓練」的反例檢查清單：
 *   故障預算、訊息合法性、模型一致、狀態表、結論。
 */
export type FaultKind = 'byz' | 'crash';
export type StepKind = 'honest' | 'faulty' | 'network' | 'timeout' | 'result';

export interface TraceStep {
  /** 這一步由誰做 */
  actor?: string;
  /** 這一步的性質：誠實節點依協議、故障節點任意行為、網路、逾時、觀察結果 */
  kind?: StepKind;
  /** 發生了什麼，可含 $...$ 數學式 */
  event: string;
  /** 這一步之後狀態有變的節點（只寫有變的），其餘沿用上一步 */
  state?: Record<string, string>;
  /** 這一步是否延遲了某則訊息 */
  delay?: boolean;
  /** 這一步發生在 GST 之前或之後（部分同步） */
  gst?: 'before' | 'after';
  /** 這一步是否出現性質被違反的結果 */
  violation?: boolean;
  /** 補充說明 */
  note?: string;
}

export const stepKindLabel: Record<StepKind, string> = {
  honest: '誠實：依協議',
  faulty: '故障：任意行為',
  network: '網路',
  timeout: '逾時',
  result: '結果',
};

export const faultKindLabel: Record<FaultKind, string> = { byz: '拜占庭', crash: 'crash' };

/** 英文版的標籤（頁面語言為英文時使用）。 */
export const stepKindLabelEn: Record<StepKind, string> = {
  honest: 'Honest: follows the protocol',
  faulty: 'Faulty: arbitrary behavior',
  network: 'Network',
  timeout: 'Timeout',
  result: 'Result',
};
export const faultKindLabelEn: Record<FaultKind, string> = { byz: 'Byzantine', crash: 'crash' };

const stepKinds = Object.keys(stepKindLabel);

/** 檢查節點、初始狀態與每一步的欄位是否自洽。有 faulty 時另外檢查「訊息合法性」。 */
export function validateTrace(
  ctx: string,
  nodes: string[],
  initial: Record<string, string>,
  steps: TraceStep[],
  faulty?: Record<string, FaultKind>,
) {
  const err = (msg: string) => {
    throw new Error(`${ctx}：${msg}`);
  };
  if (new Set(nodes).size !== nodes.length) err(`nodes 有重複的名稱：${nodes.join(', ')}`);
  for (const n of nodes) if (!(n in initial)) err(`initial 缺少節點「${n}」的初始狀態（沒有狀態就寫「—」）`);
  for (const k of Object.keys(initial)) if (!nodes.includes(k)) err(`initial 出現不在 nodes 裡的節點「${k}」`);
  if (steps.length === 0) err('steps 不能是空的');

  steps.forEach((s, i) => {
    const at = `第 ${i + 1} 步`;
    if (!s.event) err(`${at}缺少 event`);
    if (s.actor !== undefined && !nodes.includes(s.actor)) err(`${at}的 actor「${s.actor}」不在 nodes 裡`);
    if (s.kind !== undefined && !stepKinds.includes(s.kind)) err(`${at}的 kind「${s.kind}」必須是 ${stepKinds.join(' / ')} 之一`);
    for (const k of Object.keys(s.state ?? {})) if (!nodes.includes(k)) err(`${at}的 state 出現不在 nodes 裡的節點「${k}」`);
    if (faulty && s.kind) {
      if (s.kind === 'faulty' && !(s.actor && s.actor in faulty)) {
        err(`${at}標為「故障行為」，但 actor「${s.actor ?? '（未填）'}」不是故障節點。誠實節點只能依協議行動`);
      }
    }
  });
}

export interface TraceRow {
  label: string;
  step?: TraceStep;
  cells: { text: string; changed: boolean }[];
}

/** 把「只寫有變的節點」展開成每一步的完整狀態表。 */
export function computeRows(
  nodes: string[],
  initial: Record<string, string>,
  steps: TraceStep[],
  initialLabel = '初始',
): TraceRow[] {
  let cur: Record<string, string> = { ...initial };
  const rows: TraceRow[] = [
    { label: initialLabel, cells: nodes.map((n) => ({ text: cur[n], changed: false })) },
  ];
  steps.forEach((s, i) => {
    const next = { ...cur, ...(s.state ?? {}) };
    rows.push({
      label: String(i + 1),
      step: s,
      cells: nodes.map((n) => ({ text: next[n], changed: n in (s.state ?? {}) && next[n] !== cur[n] })),
    });
    cur = next;
  });
  return rows;
}
