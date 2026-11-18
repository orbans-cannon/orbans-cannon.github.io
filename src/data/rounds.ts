/**
 * 「輪數」對照表的資料（入門 intro/rounds 用）。
 *
 * 規則：
 * - 一列一個結果；每列都要標模型（時序、密碼學假設、確定性）、度量、情況與前提，因為不同列不能直接比大小。
 * - 只放讀到 body 級以上的論文（read 欄）。abstract 級的列不能顯示數字（scripts/check.mjs 會擋）。
 * - 數字照原文寫，不憑記憶填；原文用的符號與本站不同時，在 condition 說明。
 * - 新增列的順序：先確認 refs.ts 有書目、頁面有 href 指向的主頁錨點。
 * - 與 Complexity 元件的 measure 詞彙對照：lockstep 對應 rounds（同步模型的輪）；iteration 沒有對應值，
 *   因為各論文對「協議迴圈一次」的定義不同；message-delays、time 等目前沒有列，等對應頁面寫完再補。
 */
export type RoundsTiming = 'sync' | 'async' | 'sync-async';
export type RoundsDeterminism = 'det' | 'rand';
/** lockstep：同步模型的 lock-step 輪（每輪所有訊息同時送出、同時收到）；iteration：協議自己的迴圈跑一次（內含幾次訊息往返要看協議） */
export type RoundsMeasure = 'lockstep' | 'iteration';
export type RoundsCase = 'worst' | 'expected' | 'good';
export type RoundsBound = 'upper' | 'lower' | 'tight';
export type RoundsRead = 'abstract' | 'body' | 'proof' | 'reviewed';

export interface RoundsRow {
  id: string;
  /** refs.ts 的鍵 */
  refId: string;
  /** 這一列要在表裡顯示的結果名稱 */
  result: string;
  timing: RoundsTiming;
  /** 密碼學假設，一句話 */
  crypto: string;
  determinism: RoundsDeterminism;
  measure: RoundsMeasure;
  case: RoundsCase;
  bound: RoundsBound;
  /** LaTeX 字串；abstract 級的列不能有 */
  value?: string;
  /** 前提與原文用語的說明 */
  condition: string;
  read: RoundsRead;
  /** 連到該結果的主頁（可帶錨點） */
  href: string;
}

export const roundsRows: RoundsRow[] = [
  {
    id: 'fl1982',
    refId: 'fl1982',
    result: 'Fischer–Lynch：任何確定性演算法都要 $f+1$ 輪',
    timing: 'sync',
    crypto: '無簽章',
    determinism: 'det',
    measure: 'lockstep',
    case: 'worst',
    bound: 'lower',
    value: 'f+1',
    condition: '最多 $f$ 個故障 process（原文寫 $m$），要求保證 interactive consistency 的確定性演算法；原文的模型沒有簽章。',
    read: 'body',
    href: '/impossibility/sync/round-bound/',
  },
  {
    id: 'ds1983-lower',
    refId: 'ds1983',
    result: 'Dolev–Strong：加上簽章，下界仍是 $f+1$',
    timing: 'sync',
    crypto: '簽章（PKI）',
    determinism: 'det',
    measure: 'lockstep',
    case: 'worst',
    bound: 'lower',
    value: 'f+1',
    condition: '不論允許哪種訊息與協議，至少要 $t+1$ 個 phase（原文以 $t$ 表示故障 process 數的上界）；這是把 Fischer–Lynch 的下界推廣到簽章。',
    read: 'body',
    href: '/sync/dolev-strong/',
  },
  {
    id: 'ds1983-upper',
    refId: 'ds1983',
    result: 'Dolev–Strong：簽章下的演算法用 $f+1$ 輪',
    timing: 'sync',
    crypto: '簽章（PKI）',
    determinism: 'det',
    measure: 'lockstep',
    case: 'worst',
    bound: 'upper',
    value: 'f+1',
    condition: '最好的演算法只用 $t+1$ 個 phase 與 $O(nt)$ 則訊息（訊息數只計誠實 process 送出的），輪數與上一列的下界相符。',
    read: 'body',
    href: '/sync/dolev-strong/',
  },
  {
    id: 'benor1983',
    refId: 'benor1983',
    result: 'Ben-Or：隨機化協議的期望輪數是常數',
    timing: 'async',
    crypto: '無簽章（local coin）',
    determinism: 'rand',
    measure: 'iteration',
    case: 'expected',
    bound: 'upper',
    value: 'O(1)',
    condition: '定理 3：故障數 $t=O(\\sqrt{N})$ 時，$N$ 為 process 總數。協議本身是非同步的，同步地執行時期望輪數也是常數，與確定性的 $t+1$ 輪形成對比。',
    read: 'body',
    href: '/async/ben-or/',
  },
  {
    id: 'rabin1983',
    refId: 'rabin1983',
    result: 'Rabin：期望 4 輪，與 $n$、$t$ 無關',
    timing: 'async',
    crypto: '簽章加 dealer 預先分發的秘密分享',
    determinism: 'rand',
    measure: 'iteration',
    case: 'expected',
    bound: 'upper',
    value: '4',
    condition: '§6 不出錯的協議要求 $t<n/10$，原文完整處理的是非同步情形；同步情形只在結語簡述，說只需要 $t<n/4$，沒有給完整證明。「輪」指協議主迴圈跑一次，輪內有幾次訊息往返依協議而定。',
    read: 'body',
    href: '/async/ben-or/',
  },
];
