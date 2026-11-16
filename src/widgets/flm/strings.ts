/** FLM 互動圖（n=3 圓桌）的字串。中英文各一份；錯誤訊息等給作者看的字不放這裡。 */
export type Lang = 'zh-TW' | 'en';

export interface StepText {
  title: string;
  /** 說明段落 */
  body?: string[];
  /** 「Fault — …」這種逐行說明：k 是粗體標籤 */
  lines?: { k: string; t: string }[];
  /** 這一步的結論（紅色強調的那一行） */
  result?: string;
}

export interface CtStrings {
  aria: string;
  sTitle: string;
  sTitlePending: string;
  gTitle: string;
  gTitleExec: (i: number, faulty: string) => string;
  prev: string;
  next: string;
  clear: string;
  random: string;
  progress: (i: number, n: number) => string;
  legend: { in0: string; in1: string; faulty: string; frame: string; decision: string; tag: string };
  steps: StepText[];
  hintIdle: string;
  hintEdit: string;
  /** 把滑鼠移到 S 的節點時的說明：鄰居裝置相同 */
  hintNode: (p: { n: string; d: string; inp: number; nb: { n: string; d: string }[]; im: string; imNb: string[] }) => string;
  decide: (n: string, v: string) => string;
  ok: (i: number) => string;
  unknown: (i: number) => string;
  bad1: (nodes: string[]) => string;
  bad2: (w: string, x: string) => string;
  bad3: (nodes: string[]) => string;
  signLabel: string;
  mLabel: string;
  mMinus: string;
  mPlus: string;
  /** 加上簽章後，ℰ 步驟的說明（Fault 公理不成立） */
  signNote: string;
  signChain: string;
  /** m>1 時的說明：每個圓代表 m 個節點 */
  mNote: (m: number) => string;
  chainShare: (n: string) => string;
  chainBad: string;
  chainAll: (unset: number) => string;
  cut: string;
  fresh: string;
}

const zh: CtStrings = {
  aria: '覆蓋圖與現實系統並列的互動圖：n=3、m=1 的證明，共 8 步',
  sTitle: '覆蓋圖 S（圓桌）',
  sTitlePending: '覆蓋圖 S（還沒造）',
  gTitle: '現實 G（三角形）',
  gTitleExec: (i, f) => `現實 G · 執行 ℰ${sub(i)}（${f} 是故障節點）`,
  prev: '上一步',
  next: '下一步',
  clear: '清除決定',
  random: '隨機填一組',
  progress: (i, n) => `${i} / ${n}`,
  legend: {
    in0: '輸入 0',
    in1: '輸入 1',
    faulty: '故障節點',
    frame: '目前取出的一組',
    decision: '排練時的決定',
    tag: '同編號＝互相對應',
  },
  steps: [
    {
      title: '從現實出發',
      body: [
        '假設裝置 A、B、C 能在三角形 G 上解決 BA（至多 1 個故障）。右邊是 G，節點 a、b、c 分別跑 A、B、C。',
        '證明的目標是推出矛盾。為此要先在左邊造一個「看起來和 G 局部一模一樣」的圖 S。',
      ],
    },
    {
      title: '複製兩份，輸入分別是 0 與 1',
      body: [
        '把 G 複製兩份，每份仍然跑 A、B、C。左邊這份是 u、v、w，輸入全是 0；右邊這份是 x、y、z，輸入全是 1。',
        '目前它們還是兩個互不相干的三角形。',
      ],
    },
    {
      title: '交叉重接，接成圓桌',
      body: [
        '剪斷 u–w 與 x–z，改接 u–z 與 w–x，兩個三角形就接成一個六節點的環。每個節點的兩個鄰居仍然分別跑另外兩種裝置，所以從任何一個節點看出去，S 與 G 沒有差別，這就是 S 覆蓋 G。',
        '右邊每個節點旁標出它在 S 裡對應的節點：u、x 對應 a，v、y 對應 b，w、z 對應 c。把滑鼠移到 S 的節點上（或用 Tab 聚焦），可以看到它在 G 裡對應的節點與鄰居。',
      ],
    },
    {
      title: '排練：在圓桌上跑一遍',
      body: [
        '把裝置裝進 S，所有節點都照程式誠實地跑。S 不是 G 的系統，Agreement 與 Validity 在 S 上沒有任何保證；但系統是確定性的，每個節點仍然會決定出某個值，只是我們不知道是什麼。',
        '點一下 S 的節點，替它填一個決定（？→ 0 → 1），自己扮演那組裝置。接下來三步會告訴你，不管怎麼填，哪一關都擋得住。',
      ],
    },
    {
      title: 'ℰ₁：a 是故障節點，取出 (v, w)',
      lines: [
        { k: 'Fault', t: 'a 對 b 重播 u 對 v 說的話，對 c 重播 x 對 w 說的話。這樣的裝置依 Fault 公理存在。' },
        { k: 'Locality', t: 'b、c 收到的訊息和 v、w 完全相同，所以行為也相同：b ≡ v，c ≡ w。' },
        { k: 'Validity', t: '正確節點 b、c 的輸入都是 0，所以它們必須選 0。' },
      ],
      result: '所以 S 裡的 v、w 都決定 0。',
    },
    {
      title: 'ℰ₂：b 是故障節點，取出 (w, x)',
      lines: [
        { k: 'Fault', t: 'b 對 c 重播 v 對 w 說的話，對 a 重播 y 對 x 說的話。' },
        { k: 'Locality', t: 'c 的行為與 w 相同（上一步已知決定 0），a 的行為與 x 相同：c ≡ w，a ≡ x。' },
        { k: 'Agreement', t: 'a、c 都是正確節點，必須選同一個值，所以 a 也選 0。' },
      ],
      result: '所以 S 裡的 x 決定 0。',
    },
    {
      title: 'ℰ₃：c 是故障節點，取出 (x, y)',
      lines: [
        { k: 'Fault', t: 'c 對 a 重播 w 對 x 說的話，對 b 重播 z 對 y 說的話。' },
        { k: 'Locality', t: 'a、b 的行為與 x、y 相同：a ≡ x，b ≡ y。' },
        { k: 'Validity', t: '正確節點 a、b 的輸入都是 1，所以它們必須選 1。' },
      ],
      result: '所以 S 裡的 x、y 都決定 1，但上一步說 x 決定 0。',
    },
    {
      title: '串接：矛盾',
      body: [
        '三個執行各自只有一個故障節點，各自都是 G 上合法的執行。ℰ₁ 與 ℰ₂ 共用 w，ℰ₂ 與 ℰ₃ 共用 x：Agreement 把 0 從 w 傳到 x，Validity 卻把 x 釘在 1。',
        'x 不可能同時決定 0 與 1，所以 ℰ₁、ℰ₂、ℰ₃ 至少有一個違反保證。是哪一個，取決於裝置怎麼寫，證明不需要知道。',
      ],
    },
  ],
  hintIdle: '',
  hintEdit: '點一下節點替它填決定（？→ 0 → 1 → ？）。',
  hintNode: ({ n, d, inp, nb, im, imNb }) =>
    `${n}（跑 ${d}，輸入 ${inp}）的鄰居是 ${nb.map((x) => `${x.n}（${x.d}）`).join('、')}；它在 G 裡對應的 ${im} 的鄰居是 ${imNb.join('、')}，裝置種類一樣，所以局部看起來沒有差別。`,
  decide: (n, v) => `${n} 的決定：${v}`,
  ok: (i) => `在目前填的決定下，ℰ${sub(i)} 沒有違反保證。`,
  unknown: (i) => `決定還沒填完，無法判斷 ℰ${sub(i)}。`,
  bad1: (nodes) => `ℰ₁ 違反 Validity：${nodes.join('、')} 決定了 1，對應的正確節點也會選 1，但它們的輸入全是 0。`,
  bad2: (w, x) => `ℰ₂ 違反 Agreement：w 決定 ${w}、x 決定 ${x}，對應的 c、a 都是正確節點，卻選了不同的值。`,
  bad3: (nodes) => `ℰ₃ 違反 Validity：${nodes.join('、')} 決定了 0，對應的正確節點也會選 0，但它們的輸入全是 1。`,
  signLabel: '加上不可偽造的簽章（拿掉 Fault 公理）',
  mLabel: '每個圓代表的節點數 m',
  mMinus: '減少 m',
  mPlus: '增加 m',
  signNote:
    '加上不可偽造的簽章之後，S 裡傳來傳去的訊息可能帶著別的節點的簽章，而這些簽章簽的內容，在 ℰ 裡對應的正確節點並沒有簽過（例如在 ℰ₂ 裡 a 的輸入是 1，卻要重播一則帶有 a 對 0 的簽章的訊息）。故障節點偽造不出來，所以上面灰色的重播做不到，Fault 公理不成立，這個情景不再是 G 上的合法執行，證明在這一步斷掉。',
  signChain: '三個執行的重播都可能做不到，情景接不起來，也就推不出矛盾；這正是同步加簽章可以用更少節點解決 BA 的原因。',
  mNote: (m) => `目前每個圓代表一組 m = ${m} 個節點，所以 n = 3m = ${3 * m}。每個執行裡故障的是整整一組（${m} 個，沒有超過預算 m），正確的是另外兩組（${2 * m} 個，正好是 n − m）。`,
  chainShare: (n) => `共用 ${n}`,
  chainBad: '違反保證',
  chainAll: (u) => (u > 0 ? `還有 ${u} 個節點沒填決定，填完就能看到是哪一個執行違反保證。` : ''),
  cut: '剪斷',
  fresh: '新接',
};

const en: CtStrings = {
  aria: 'Interactive figure placing the covering graph beside the real system: the n=3, m=1 proof in 8 steps',
  sTitle: 'Covering graph S (round table)',
  sTitlePending: 'Covering graph S (not built yet)',
  gTitle: 'Reality G (triangle)',
  gTitleExec: (i, f) => `Reality G · execution ℰ${sub(i)} (${f} is Byzantine)`,
  prev: 'Back',
  next: 'Next',
  clear: 'Clear decisions',
  random: 'Fill at random',
  progress: (i, n) => `${i} / ${n}`,
  legend: {
    in0: 'input 0',
    in1: 'input 1',
    faulty: 'Byzantine node',
    frame: 'current pair',
    decision: 'decision in the rehearsal',
    tag: 'same number = matching nodes',
  },
  steps: [
    {
      title: 'Start from reality',
      body: [
        'Suppose devices A, B, C solve BA on the triangle G (at most one fault). G is on the right; nodes a, b, c run A, B, C.',
        'The goal is a contradiction. To get one, we first build on the left a graph S that looks locally exactly like G.',
      ],
    },
    {
      title: 'Copy it twice, with inputs 0 and 1',
      body: [
        'Make two copies of G, each still running A, B, C. The left copy is u, v, w with input 0; the right copy is x, y, z with input 1.',
        'For now they are two unrelated triangles.',
      ],
    },
    {
      title: 'Cross-wire into a round table',
      body: [
        'Cut u–w and x–z, then connect u–z and w–x. The two triangles become one ring of six nodes. Every node still has one neighbour running each of the other two devices, so from any node S looks the same as G. This is what it means for S to cover G.',
        'Next to each node of G is the set of S-nodes that map to it: u, x map to a; v, y to b; w, z to c. Hover over (or Tab to) a node of S to see its image and neighbours in G.',
      ],
    },
    {
      title: 'Rehearsal: run the devices on the round table',
      body: [
        'Install the devices on S; every node runs its program honestly. S is not a system of G, so Agreement and Validity promise nothing on it. But the system is deterministic, so every node still decides some value; we just do not know which.',
        'Click a node of S to fill in a decision (? → 0 → 1) and play the devices yourself. The next three steps show that, however you fill them in, one of the checks catches you.',
      ],
    },
    {
      title: 'ℰ₁: a is Byzantine; take (v, w)',
      lines: [
        { k: 'Fault', t: 'a shows b what u showed v, and shows c what x showed w. By the Fault axiom such a device exists.' },
        { k: 'Locality', t: 'b and c receive exactly what v and w received, so they behave the same: b ≡ v, c ≡ w.' },
        { k: 'Validity', t: 'The correct nodes b, c both have input 0, so they must choose 0.' },
      ],
      result: 'So v and w both decide 0 in S.',
    },
    {
      title: 'ℰ₂: b is Byzantine; take (w, x)',
      lines: [
        { k: 'Fault', t: 'b shows c what v showed w, and shows a what y showed x.' },
        { k: 'Locality', t: 'c behaves like w (which decided 0 in the previous step) and a behaves like x: c ≡ w, a ≡ x.' },
        { k: 'Agreement', t: 'a and c are both correct, so they must agree: a also chooses 0.' },
      ],
      result: 'So x decides 0 in S.',
    },
    {
      title: 'ℰ₃: c is Byzantine; take (x, y)',
      lines: [
        { k: 'Fault', t: 'c shows a what w showed x, and shows b what z showed y.' },
        { k: 'Locality', t: 'a and b behave like x and y: a ≡ x, b ≡ y.' },
        { k: 'Validity', t: 'The correct nodes a, b both have input 1, so they must choose 1.' },
      ],
      result: 'So x and y both decide 1 in S, yet the previous step said x decides 0.',
    },
    {
      title: 'Chain them: contradiction',
      body: [
        'Each execution has only one faulty node, so each is a legal execution of G. ℰ₁ and ℰ₂ share w, and ℰ₂ and ℰ₃ share x: Agreement carries 0 from w to x, while Validity pins x to 1.',
        'x cannot decide both 0 and 1, so at least one of ℰ₁, ℰ₂, ℰ₃ violates the guarantee. Which one depends on how the devices are written; the proof never needs to know.',
      ],
    },
  ],
  hintIdle: '',
  hintEdit: 'Click a node to fill in its decision (? → 0 → 1 → ?).',
  hintNode: ({ n, d, inp, nb, im, imNb }) =>
    `${n} (runs ${d}, input ${inp}) has neighbours ${nb.map((x) => `${x.n} (${x.d})`).join(', ')}; its image ${im} in G has neighbours ${imNb.join(', ')}. The same kinds of devices, so locally there is no difference.`,
  decide: (n, v) => `Decision of ${n}: ${v}`,
  ok: (i) => `With the decisions filled in, ℰ${sub(i)} does not violate the guarantee.`,
  unknown: (i) => `Decisions are incomplete, so ℰ${sub(i)} cannot be judged yet.`,
  bad1: (nodes) => `ℰ₁ violates Validity: ${nodes.join(', ')} decided 1, so the matching correct nodes also choose 1, although their inputs are all 0.`,
  bad2: (w, x) => `ℰ₂ violates Agreement: w decided ${w} and x decided ${x}, so the matching correct nodes c and a choose different values.`,
  bad3: (nodes) => `ℰ₃ violates Validity: ${nodes.join(', ')} decided 0, so the matching correct nodes also choose 0, although their inputs are all 1.`,
  signLabel: 'Add unforgeable signatures (drop the Fault axiom)',
  mLabel: 'Nodes per circle, m',
  mMinus: 'Decrease m',
  mPlus: 'Increase m',
  signNote:
    'With unforgeable signatures, the messages travelling around S may carry other nodes’ signatures, on contents that the matching correct node of ℰ never signed (for instance in ℰ₂ node a has input 1, yet it would have to replay a message carrying a’s signature on 0). The faulty node cannot forge that, so the grey replays above are impossible, the Fault axiom fails, this scenario is no longer a legal execution of G, and the proof breaks at this step.',
  signChain: 'The replays in all three executions may be impossible, so the scenarios cannot be chained and no contradiction follows; this is why synchrony with signatures can solve BA with fewer nodes.',
  mNote: (m) => `Each circle now stands for a group of m = ${m} nodes, so n = 3m = ${3 * m}. In every execution one whole group (${m} nodes, within the budget m) is faulty and the other two groups (${2 * m} nodes, exactly n − m) are correct.`,
  chainShare: (n) => `shares ${n}`,
  chainBad: 'violates',
  chainAll: (u) => (u > 0 ? `${u} node(s) still have no decision; fill them all in to see which execution breaks the guarantee.` : ''),
  cut: 'cut',
  fresh: 'new',
};

export function sub(i: number) {
  return ['', '₁', '₂', '₃'][i];
}

export const ctStrings: Record<Lang, CtStrings> = { 'zh-TW': zh, en };
