/**
 * 模型總覽（impossibility/overview.mdx）的唯一資料來源：
 * 同一份資料產生「矩陣圖」（OverviewMatrix）與「完整表格」（OverviewTable），兩邊不會互相矛盾。
 * 改任何一列的敘述，都要同步回頭看頁面上「各列的依據」那段文字是否仍然一致。
 * 字串可含 $...$（用 renderInline 渲染）。
 */

export type Timing = 'sync' | 'partial' | 'async';

export interface OverviewRow {
  /** 列號（頁面「各列的依據」用「第 N 列」指稱，不要改號） */
  id: number;
  timing: Timing;
  crypto: string;
  determinism: string;
  problem: string;
  /** 容錯上界；strong 會以粗體排在最前面（例如「不可能」） */
  bound: string;
  strong?: string;
  /** 矩陣格子裡的短敘述（從 bound 濃縮，不能多講） */
  short: string;
}

export const overviewRows: OverviewRow[] = [
  {
    id: 1,
    timing: 'sync',
    crypto: '無簽章',
    determinism: '確定性',
    problem: 'BB／BA',
    bound: '$n\\ge 3f+1$ 必要且充分；通訊圖連通度 $\\ge 2f+1$；至少 $f+1$ 輪',
    short: '$n\\ge 3f+1$，至少 $f+1$ 輪',
  },
  {
    id: 2,
    timing: 'sync',
    crypto: '簽章',
    determinism: '確定性',
    problem: 'BB（發送者簽署）',
    bound: '任意 $f$；至少 $f+1$ 輪；存在 $f+1$ 輪、$O(nf)$ 訊息的演算法',
    short: 'BB：任意 $f$',
  },
  {
    id: 3,
    timing: 'sync',
    crypto: '簽章',
    determinism: '確定性',
    problem: '二元 BA（無指定發送者）',
    bound: '$n>2f$，即 $f<n/2$。若輸入的值不只兩種（共 $m$ 種），且要求輸出必為某個誠實節點的輸入，則需要 $n>mf$：可能的值越多，需要的節點越多',
    short: '二元 BA：$f<n/2$',
  },
  {
    id: 4,
    timing: 'partial',
    crypto: '有或無簽章',
    determinism: '確定性',
    problem: 'BA',
    bound: '$n\\ge 3f+1$ 必要且充分；簽章不改善容錯',
    short: '$n\\ge 3f+1$（簽章不改善）',
  },
  {
    id: 5,
    timing: 'async',
    crypto: '不限（故障只需是 crash）',
    determinism: '確定性',
    problem: '二元共識',
    strong: '不可能',
    bound: '：每個協議都存在不終止的執行',
    short: '不可能（FLP）',
  },
  {
    id: 6,
    timing: 'async',
    crypto: '免簽章',
    determinism: '隨機化（local coin）',
    problem: 'BA',
    bound: 'Bracha：$f<n/3$；$f=\\Theta(n)$ 時期望時間為指數（CKS 的比較）；Ben-Or 為此線原型，容忍 $5f<n$',
    short: '$f<n/3$（Bracha）；$f=\\Theta(n)$ 時期望時間為指數',
  },
  {
    id: 7,
    timing: 'async',
    crypto: '免簽章，假設 common coin',
    determinism: '隨機化',
    problem: '二元 BA',
    bound: '$n\\ge 3f+1$、每輪 $O(n^2)$ 訊息、期望 $O(1)$ 輪（MMR）',
    short: '$n\\ge 3f+1$，期望 $O(1)$ 輪（MMR）',
  },
  {
    id: 8,
    timing: 'async',
    crypto: '門檻簽章＋common coin（setup 需 trusted dealer）',
    determinism: '隨機化',
    problem: '二元 BA',
    bound: '$f<n/3$、期望常數時間、期望 $O(n^2)$ 訊息（CKS）',
    short: '$f<n/3$，期望常數時間（CKS，門檻簽章）',
  },
];

/**
 * 矩陣的版面：列＝時序，欄＝「確定性・無簽章／確定性・簽章／隨機化・local coin／隨機化・common coin」。
 * 每格列出落在這格的列號；span 是跨幾欄；rows 為空表示本表沒有收錄這格（不是「沒有結果」）。
 */
export const matrixColumns = [
  { key: 'det-nosig', label: '確定性・無簽章' },
  { key: 'det-sig', label: '確定性・簽章' },
  { key: 'rand-local', label: '隨機化・local coin' },
  { key: 'rand-common', label: '隨機化・common coin' },
] as const;

export interface MatrixCell {
  span: number;
  rows: number[];
}

export const matrixLayout: { timing: Timing; label: string; cells: MatrixCell[] }[] = [
  {
    timing: 'sync',
    label: '同步',
    cells: [
      { span: 1, rows: [1] },
      { span: 1, rows: [2, 3] },
      { span: 2, rows: [] },
    ],
  },
  {
    timing: 'partial',
    label: '部分同步',
    cells: [
      { span: 2, rows: [4] },
      { span: 2, rows: [] },
    ],
  },
  {
    timing: 'async',
    label: '非同步',
    cells: [
      { span: 2, rows: [5] },
      { span: 1, rows: [6] },
      { span: 1, rows: [7, 8] },
    ],
  },
];

// 自我檢查：每一列都恰好出現在矩陣的一格裡、時序一致、每列的格數加起來是 4
{
  const seen = new Map<number, number>();
  for (const r of matrixLayout) {
    const total = r.cells.reduce((a, c) => a + c.span, 0);
    if (total !== matrixColumns.length) throw new Error(`overview：矩陣「${r.label}」的格子跨欄總數是 ${total}，應為 ${matrixColumns.length}`);
    for (const c of r.cells)
      for (const id of c.rows) {
        const row = overviewRows.find((x) => x.id === id);
        if (!row) throw new Error(`overview：矩陣引用了不存在的第 ${id} 列`);
        if (row.timing !== r.timing) throw new Error(`overview：第 ${id} 列的時序是 ${row.timing}，卻放在矩陣的「${r.label}」`);
        seen.set(id, (seen.get(id) ?? 0) + 1);
      }
  }
  for (const row of overviewRows)
    if (seen.get(row.id) !== 1) throw new Error(`overview：第 ${row.id} 列在矩陣中出現 ${seen.get(row.id) ?? 0} 次，應為 1 次`);
}

/** 英文版的列內容（與 overviewRows 以 id 對應；結構與數學相同，只有文字不同）。 */
export const overviewRowsEn: Record<number, { crypto: string; determinism: string; problem: string; bound: string; strong?: string; short: string }> = {
  1: { crypto: 'No signatures', determinism: 'Deterministic', problem: 'BB / BA', bound: '$n\\ge 3f+1$ necessary and sufficient; graph connectivity $\\ge 2f+1$; at least $f+1$ rounds', short: '$n\\ge 3f+1$, at least $f+1$ rounds' },
  2: { crypto: 'Signatures', determinism: 'Deterministic', problem: 'BB (signed by the sender)', bound: 'Any $f$; at least $f+1$ rounds; an algorithm exists with $f+1$ rounds and $O(nf)$ messages', short: 'BB: any $f$' },
  3: { crypto: 'Signatures', determinism: 'Deterministic', problem: 'Binary BA (no designated sender)', bound: '$n>2f$, i.e. $f<n/2$. If inputs can take more than two values ($m$ of them) and the output must be the input of some honest node, $n>mf$ is needed: the more possible values, the more nodes are required', short: 'Binary BA: $f<n/2$' },
  4: { crypto: 'With or without signatures', determinism: 'Deterministic', problem: 'BA', bound: '$n\\ge 3f+1$ necessary and sufficient; signatures do not improve fault tolerance', short: '$n\\ge 3f+1$ (signatures do not help)' },
  5: { crypto: 'Any (faults only need to be crash)', determinism: 'Deterministic', problem: 'Binary consensus', strong: 'Impossible', bound: ': every protocol has a non-terminating execution', short: 'Impossible (FLP)' },
  6: { crypto: 'No signatures', determinism: 'Randomized (local coin)', problem: 'BA', bound: 'Bracha: $f<n/3$; with $f=\\Theta(n)$ the expected time is exponential (CKS comparison); Ben-Or is the prototype of this line, tolerating $5f<n$', short: '$f<n/3$ (Bracha); exponential expected time when $f=\\Theta(n)$' },
  7: { crypto: 'No signatures, assumes a common coin', determinism: 'Randomized', problem: 'Binary BA', bound: '$n\\ge 3f+1$, $O(n^2)$ messages per round, expected $O(1)$ rounds (MMR)', short: '$n\\ge 3f+1$, expected $O(1)$ rounds (MMR)' },
  8: { crypto: 'Threshold signatures + common coin (setup needs a trusted dealer)', determinism: 'Randomized', problem: 'Binary BA', bound: '$f<n/3$, expected constant time, expected $O(n^2)$ messages (CKS)', short: '$f<n/3$, expected constant time (CKS, threshold signatures)' },
};

export const matrixColumnsEn = ['Deterministic · no signatures', 'Deterministic · signatures', 'Randomized · local coin', 'Randomized · common coin'];
export const matrixTimingLabelEn = { sync: 'Synchronous', partial: 'Partially synchronous', async: 'Asynchronous' } as const;
