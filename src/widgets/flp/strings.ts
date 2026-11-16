/** FLP 互動圖的字串（中英）。給作者看的錯誤訊息不放這裡。 */
import { sub, type Lang } from './symbols';

export interface StepText { h: string; ps: string[]; result?: string; bad?: boolean }

interface Common {
  prev: string;
  next: string;
  play: string;
  pause: string;
  progress: (i: number, n: number) => string;
  legend: { v0: string; v1: string; vb: string; vq: string; gold: string; bad: string };
}
const common: Record<Lang, Common> = {
  'zh-TW': {
    prev: '上一步', next: '下一步', play: '播放', pause: '暫停',
    progress: (i, n) => `${i} / ${n}`,
    legend: { v0: '結局只可能是 0（0-valent）', v1: '結局只可能是 1（1-valent）', vb: '兩種結局都還有可能（bivalent）', vq: '還沒標', gold: '選中／新畫的', bad: '矛盾' },
  },
  en: {
    prev: 'Back', next: 'Next', play: 'Play', pause: 'Pause',
    progress: (i, n) => `${i} / ${n}`,
    legend: { v0: 'the outcome can only be 0 (0-valent)', v1: 'the outcome can only be 1 (1-valent)', vb: 'both outcomes still possible (bivalent)', vq: 'unlabeled', gold: 'selected / newly drawn', bad: 'contradiction' },
  },
};
export const C = (l: Lang) => common[l];

// ---------------------------------------------------------------- 圖 A：引理 2 的初始配置鏈

export interface ChainInfo {
  n0: number; n1: number; nb: number; nq: number;
  pair: { c0: string; c1: string; p: number } | null;
  v: '0' | '1';
}
interface ChainStrings {
  aria: string;
  random: string; example: string; clear: string;
  decideLabel: string;
  hintIdle: string;
  hintNode: (cfg: string, val: string) => string;
  valName: Record<string, string>;
  cardNote: Record<'0' | '1', string>;
  pairNote: (p: number) => string;
  world0: (c0: string) => string;
  world1: (c1: string) => string;
  wall: (p: number) => string;
  stopped: (p: number) => string;
  inputLbl: (bit: string) => string;
  decideTxt: string;
  msgs: string;
  sameView: (a: number, b: number) => string;
  contra0: string; contra1: string;
  caption: (step: number, i: ChainInfo) => string;
  steps: (i: ChainInfo) => StepText[];
}
const P = (n: number) => `p${sub(n)}`;
const chainZh: ChainStrings = {
  aria: '引理 2 的互動圖：8 個初始配置排成一條鏈，標出每個配置的結局，找到相鄰且結局相反的一對，再看「兩個世界」怎麼推出矛盾',
  random: '隨機標', example: '範例標記', clear: '清除',
  decideLabel: 'σ 最後決定的值',
  hintIdle: '點一個初始配置，輪流標成：只可能 0、只可能 1、兩種都可能、未標。',
  hintNode: (cfg, val) => `初始配置 ${cfg}：${val}。點一下換下一種標記。`,
  valName: { '?': '還沒標', '0': '結局只可能是 0', '1': '結局只可能是 1', B: '兩種結局都還有可能' },
  cardNote: { '0': '結局只可能是 0', '1': '結局只可能是 1' },
  pairNote: (p) => `兩個配置只差 ${P(p)} 的輸入`,
  world0: (c0) => `世界一：從 C₀ = ${c0} 出發`,
  world1: (c1) => `世界二：從 C₁ = ${c1} 出發`,
  wall: (p) => `沒有任何訊息來自 ${P(p)}`,
  stopped: (p) => `${P(p)} 停止`,
  inputLbl: (b) => `輸入 ${b}`,
  decideTxt: '決定',
  msgs: 'σ：互相收發訊息',
  sameView: (a, b) => `${P(a)}、${P(b)} 看到的完全一樣，所以同一個 σ 也會發生`,
  contra0: 'C₀ 只可能決定 0，卻決定了 1 ✗',
  contra1: 'C₁ 只可能決定 1，卻決定了 0 ✗',
  caption: (step, i) => {
    const p = i.pair ? P(i.pair.p) : 'p';
    return ['先看每個初始配置的「結局可能是什麼」', '找到相鄰、結局相反的一對配置', `讓 ${p} 停止：兩個世界裡，其他人看到的完全一樣`, 'σ 的決定值一定推翻其中一邊'][step];
  },
  steps: (i) => {
    const count = `目前標記：只可能 0 的 ${i.n0} 個、只可能 1 的 ${i.n1} 個、兩種都可能的 ${i.nb} 個、未標 ${i.nq} 個。`;
    const pairName = i.pair ? `C₀ = ${i.pair.c0}、C₁ = ${i.pair.c1}` : '';
    const noPair = i.nb > 0
      ? '你標了「兩種都可能」：引理 2 要的 bivalent 初始配置已經在你的標記裡了。下面的論證是在「每個初始配置都只有一種結局」的假設下進行的，所以請先把它改掉，再往下看。'
      : '還需要同時標出「只可能 0」與「只可能 1」的配置（部分正確要求兩種結局都有可能出現），才找得到結局相反的相鄰配置。';
    const p = i.pair ? P(i.pair.p) : 'p';
    return [
      {
        h: '先看每個初始配置的結局',
        ps: [
          '3 個 process 各有一個輸入，共 8 種組合。鏈上把它們排成一排，相鄰兩個只差一個 process 的輸入。每個配置下面的符號，是「從這裡出發，所有可能的執行最後會決定哪些值」：空心 0 是只可能決定 0（0-valent），實心 1 是只可能決定 1（1-valent），左空右實是兩種都還有可能（bivalent）。',
          '圖一開始預填的，是前面例子裡那個「等三個輸入到齊才做多數決」的協議：決定值就是三個輸入的多數，所以每個配置都只有一種結局。你也可以點配置，自己當協議來標。',
          count,
        ],
      },
      {
        h: '找到相鄰、結局相反的一對',
        ps: i.pair
          ? [`從左往右，第一對相鄰、一個只可能決定 0、另一個只可能決定 1 的配置是 ${pairName}。它們只差 ${p} 的輸入（0 對 1）。`, '這一對在哪裡，由協議決定。不論你怎麼標，只要兩種結局都出現、而且沒有「兩種都可能」的配置，鏈上就一定有這樣一對。']
          : [noPair],
      },
      {
        h: '兩個世界，只差一個沉默的 process',
        ps: i.pair
          ? [
              `協議必須容忍一個 process 停止，那就讓 ${p} 停止：它什麼都不做，也不傳任何訊息。這時從 C₀ 出發有一條執行 σ，其他兩個 process 互相收發訊息，最後有人決定（你可以在上面選它決定 0 或 1）。`,
              `C₁ 與 C₀ 只差 ${p} 的輸入，而 ${p} 沒說任何話，所以另外兩個 process 在世界二收到的訊息，和世界一完全相同，所以同一個 σ 也會發生，也決定同一個值 ${i.v}。`,
              '回到多數決的例子：它在這裡卡住，因為兩個 process 等不到第三個輸入，根本沒有這樣的 σ。想讓 σ 存在，協議就得在只聽到兩個輸入時決定，而矛盾就出在這裡。',
            ]
          : [noPair],
      },
      {
        h: '矛盾',
        ps: i.pair
          ? [i.v === '1' ? 'σ 在世界一決定了 1，但 C₀ 的結局只可能是 0，矛盾。' : 'σ 在世界二決定了 0，但 C₁ 的結局只可能是 1，矛盾。']
          : [noPair],
        result: i.pair ? '不論 σ 決定 0 還是 1，都有一邊被推翻。所以不可能每個初始配置都只有一種結局：一定有 bivalent 的初始配置。' : undefined,
        bad: !!i.pair,
      },
    ];
  },
};
const chainEn: ChainStrings = {
  aria: 'Interactive figure for Lemma 2: 8 initial configurations in a chain, label the outcomes of each, find two neighbors with opposite outcomes, then see how the "two worlds" yield a contradiction',
  random: 'Random', example: 'Example', clear: 'Clear',
  decideLabel: 'Value σ finally decides',
  hintIdle: 'Click an initial configuration to cycle its label: only 0, only 1, both possible, unlabeled.',
  hintNode: (cfg, val) => `Initial configuration ${cfg}: ${val}. Click to switch to the next label.`,
  valName: { '?': 'unlabeled', '0': 'the outcome can only be 0', '1': 'the outcome can only be 1', B: 'both outcomes still possible' },
  cardNote: { '0': 'the outcome can only be 0', '1': 'the outcome can only be 1' },
  pairNote: (p) => `the two configurations differ only in the input of ${P(p)}`,
  world0: (c0) => `World 1: starting from C₀ = ${c0}`,
  world1: (c1) => `World 2: starting from C₁ = ${c1}`,
  wall: (p) => `no message ever comes from ${P(p)}`,
  stopped: (p) => `${P(p)} stops`,
  inputLbl: (b) => `input ${b}`,
  decideTxt: 'decides',
  msgs: 'σ: exchange messages',
  sameView: (a, b) => `${P(a)} and ${P(b)} see exactly the same thing, so the same σ happens here too`,
  contra0: 'C₀ can only decide 0, yet decides 1 ✗',
  contra1: 'C₁ can only decide 1, yet decides 0 ✗',
  caption: (step, i) => {
    const p = i.pair ? P(i.pair.p) : 'p';
    return ['First, what outcomes each initial configuration can have', 'Find two neighbors with opposite outcomes', `Silence ${p}: in both worlds everyone else sees exactly the same`, 'The value σ decides refutes one side'][step];
  },
  steps: (i) => {
    const count = `Labels so far: ${i.n0} only-0, ${i.n1} only-1, ${i.nb} both-possible, ${i.nq} unlabeled.`;
    const pairName = i.pair ? `C₀ = ${i.pair.c0} and C₁ = ${i.pair.c1}` : '';
    const noPair = i.nb > 0
      ? 'You labeled a configuration "both possible", so Lemma 2 already holds for your labeling. The argument below assumes every initial configuration has only one possible outcome; remove that label to follow it.'
      : 'Label at least one only-0 and one only-1 configuration (partial correctness requires both outcomes to occur); only then is there an adjacent pair with opposite outcomes.';
    const p = i.pair ? P(i.pair.p) : 'p';
    return [
      {
        h: 'First, the outcomes of each initial configuration',
        ps: [
          'Three processes each have an input, giving 8 combinations. The chain lines them up so that neighbors differ in the input of exactly one process. The symbol under each configuration says which values the possible executions from there can end up deciding: hollow 0 means only 0 (0-valent), filled 1 means only 1 (1-valent), half-and-half means both are still possible (bivalent).',
          'The figure starts prefilled with the protocol from the example above, "wait for all three inputs, then take the majority": the decision is the majority of the three inputs, so every configuration has a single outcome. You can click configurations to play the protocol yourself.',
          count,
        ],
      },
      {
        h: 'Find two neighbors with opposite outcomes',
        ps: i.pair
          ? [`Scanning from the left, the first adjacent pair with one only-0 and one only-1 configuration is ${pairName}. They differ only in the input of ${p} (0 versus 1).`, 'Where this pair sits depends on the protocol. However you label, as long as both outcomes appear and no configuration is "both possible", the chain must contain such a pair.']
          : [noPair],
      },
      {
        h: 'Two worlds that differ only in a silent process',
        ps: i.pair
          ? [
              `The protocol must tolerate one process stopping, so let ${p} stop: it does nothing and sends no message. Then from C₀ there is a run σ in which the other two processes exchange messages and someone finally decides (pick 0 or 1 above).`,
              `C₁ and C₀ differ only in the input of ${p}, and ${p} says nothing, so the other two processes receive exactly the same messages in world 2 as in world 1. The same σ happens, and decides the same value ${i.v}.`,
              'Back to the majority example: it gets stuck here, because the two processes never receive a third input, so no such σ exists. To make σ exist the protocol would have to decide after hearing only two inputs, and that is where the contradiction comes from.',
            ]
          : [noPair],
      },
      {
        h: 'Contradiction',
        ps: i.pair
          ? [i.v === '1' ? 'σ decides 1 in world 1, but the outcome of C₀ can only be 0: contradiction.' : 'σ decides 0 in world 2, but the outcome of C₁ can only be 1: contradiction.']
          : [noPair],
        result: i.pair ? 'Whether σ decides 0 or 1, one side is refuted. So it cannot be that every initial configuration has a single outcome: some initial configuration is bivalent.' : undefined,
        bad: !!i.pair,
      },
    ];
  },
};
export const CHAIN = (l: Lang) => (l === 'en' ? chainEn : chainZh);

// ---------------------------------------------------------------- 圖 B：引理 3 的兩種情形

interface CasesStrings {
  aria: string;
  askWho: string;
  caseNe: string; caseEq: string;
  cloudC: string; cloudD: string;
  hintIdle: string;
  legendE: string; legendEp: string; legendSig: string;
  conflict: string;
  deciding: string;
  mustUni: string;
  capNe: string[];
  capEq: string[];
  stepsNe: StepText[];
  stepsEq: StepText[];
}
const setup = {
  zh: ['C 是 bivalent，p 被強迫先做 e（收一則訊息）。左邊的雲是不做 e 就能到達的配置，右邊的雲是對左邊每個配置做 e 之後得到的配置。', '反證：假設右邊每個配置的結局都已經定了。於是在左邊能找到相鄰的 C₀、C₁（細線 e′ 連起來），使 C₀ 做 e 之後只可能決定 0、C₁ 做 e 之後只可能決定 1。e′ 是誰做的？上方選一種。'],
  en: ['C is bivalent and p is forced to do e (receive one message) first. The left cloud holds the configurations reachable without e; the right cloud holds what you get by doing e from each of them.', 'Suppose, for contradiction, that the outcome of every configuration on the right is already settled. Then on the left there are neighbors C₀, C₁ (joined by the thin line e′) such that after e, C₀ can only decide 0 and C₁ can only decide 1. Who does e′? Pick one above.'],
};
const casesZh: CasesStrings = {
  aria: '引理 3 的互動圖：選相鄰那一步是別人做的還是 p 自己做的，看兩種情形怎麼推出矛盾',
  askWho: 'e′ 是誰做的？',
  caseNe: '別人做的（p′ ≠ p）',
  caseEq: 'p 自己做的（p′ = p）',
  cloudC: '不做 e 就能到達的配置',
  cloudD: '對它們做 e 之後',
  hintIdle: '先選相鄰那一步是誰做的，再用「上一步／下一步」看。淡色的是這一步用不到的部分。',
  legendE: 'e：強迫發生的那一步（粗線）',
  legendEp: 'e′：相鄰的那一步（細線）',
  legendSig: 'σ：p 完全不動的一串步驟（虛線）',
  conflict: '結局只可能是 0 的配置，後繼不能只可能是 1',
  deciding: '有人已決定',
  mustUni: '已有人決定，只能有一種結局',
  capNe: [
    '假設 e 之後的結局都已經定了；相鄰的 C₀、C₁ 做 e 之後結局相反',
    '別人做的 e′ 和 e 可以交換順序，到同一個配置',
    'D₁ 是 D₀ 的後繼，結局應該一樣，卻相反',
    '矛盾：這種情形不可能發生',
  ],
  capEq: [
    '假設 e 之後的結局都已經定了；相鄰的 C₀、C₁ 做 e 之後結局相反',
    'p 完全不動，從 C₀ 一路走到有人決定的 A',
    '這串步驟裡沒有 p，所以也能接在 D₀、D₁ 後面',
    'A 再做 e，到達 E₀（可以交換順序）',
    'A 先做 e′ 再做 e，到達 E₁（可以交換順序）',
    '從 A 兩種結局都到得了，所以 A 是 bivalent',
    '矛盾：A 已有人決定，只能有一種結局',
  ],
  stepsNe: [
    { h: '反證的設定', ps: setup.zh },
    { h: '別人做的 e′：可以交換', ps: ['e′ 和 e 是不同 process 做的，彼此不影響，所以先 e 後 e′，與先 e′ 後 e，到同一個配置。因此 D₁（C₁ 做 e）也就是 D₀ 再做 e′。'] },
    { h: '結局應該一樣，卻相反', ps: ['D₀ 的結局只可能是 0，它走一步 e′ 得到的 D₁，結局也只能是 0（已經定了的結局不會變）。但 D₁ 的結局只可能是 1。'] },
    { h: '矛盾', ps: ['D₁ 同時只可能是 0 又只可能是 1，不可能。'], result: '所以「相鄰那一步是別人做的」這種情形不可能發生。', bad: true },
  ],
  stepsEq: [
    { h: '反證的設定', ps: setup.zh },
    { h: 'p 自己做的 e′：先找一條 p 不動的繞路', ps: ['e′ 也是 p 做的，這時 e 與 e′ 不能交換。換個辦法：讓 p 完全不動（把它當成那個故障的 process，所以這是容許的執行），協議必須讓其他人繼續走到有人決定。這串步驟叫 σ，從 C₀ 走到 A。'] },
    { h: '同一串 σ 也能接在 D₀、D₁ 後面', ps: ['σ 裡沒有 p 的步驟，而 e、e′ 都是 p 做的，彼此不影響，所以 σ 也能接在 D₀、D₁ 之後，得到 E₀、E₁。已經定了的結局不會變，所以 E₀ 只可能是 0，E₁ 只可能是 1。'] },
    { h: 'A 再做 e，就是 E₀', ps: ['A 是 C₀ 走完 σ，E₀ 是 C₀ 先做 e 再走 σ。σ 與 e 不同人做，可以交換，所以 A 再做 e，就是 E₀。'] },
    { h: 'A 先做 e′ 再做 e，就是 E₁', ps: ['同樣道理，A 先做 e′ 得到 A′，再做 e，就是 C₁ 先做 e 再走 σ 的結果 E₁。'] },
    { h: 'A 是 bivalent', ps: ['從 A 既能到結局只可能是 0 的 E₀，也能到結局只可能是 1 的 E₁，所以 A 兩種結局都還有可能，是 bivalent。'] },
    { h: '矛盾', ps: ['但 A 是一條決定性執行的終點，已經有 process 進入決定狀態，結局不可能還兩種都有。'], result: '所以「相鄰那一步也是 p 做的」這種情形也不可能發生。', bad: true },
  ],
};
const casesEn: CasesStrings = {
  aria: 'Interactive figure for Lemma 3: choose whether the neighboring step is taken by another process or by p itself, and see how each case reaches a contradiction',
  askWho: 'Who takes e′?',
  caseNe: 'Another process (p′ ≠ p)',
  caseEq: 'p itself (p′ = p)',
  cloudC: 'reachable without e',
  cloudD: 'after doing e',
  hintIdle: 'First choose who takes the neighboring step, then use Back / Next. Faded parts are not used in this step.',
  legendE: 'e: the step we force (thick line)',
  legendEp: 'e′: the neighboring step (thin line)',
  legendSig: 'σ: steps in which p does nothing (dashed)',
  conflict: 'a configuration that can only decide 0 cannot have a successor that can only decide 1',
  deciding: 'someone has decided',
  mustUni: 'someone has decided: only one outcome left',
  capNe: [
    'Suppose every outcome after e is already settled; neighbors C₀, C₁ have opposite outcomes after e',
    'e′, taken by another process, can swap places with e and reach the same configuration',
    'D₁ is a successor of D₀, so it should have the same outcome, yet it is opposite',
    'Contradiction: this case cannot happen',
  ],
  capEq: [
    'Suppose every outcome after e is already settled; neighbors C₀, C₁ have opposite outcomes after e',
    'p does nothing; from C₀ we walk to A, where someone has decided',
    'These steps contain none of p, so they also fit after D₀ and D₁',
    'Doing e from A gives E₀ (the steps swap)',
    'Doing e′ and then e from A gives E₁ (the steps swap)',
    'From A both outcomes are reachable, so A is bivalent',
    'Contradiction: someone has decided at A, so only one outcome is left',
  ],
  stepsNe: [
    { h: 'The setup of the contradiction', ps: setup.en },
    { h: 'e′ taken by another process: the steps swap', ps: ['e′ and e are taken by different processes and do not affect each other, so e then e′ reaches the same configuration as e′ then e. Hence D₁ (C₁ after e) is D₀ followed by e′.'] },
    { h: 'Same outcome expected, opposite found', ps: ['D₀ can only decide 0, so D₁, one step e′ later, can only decide 0 too (a settled outcome never changes). But D₁ can only decide 1.'] },
    { h: 'Contradiction', ps: ['D₁ would be both only-0 and only-1.'], result: 'So "the neighboring step is taken by another process" cannot happen.', bad: true },
  ],
  stepsEq: [
    { h: 'The setup of the contradiction', ps: setup.en },
    { h: 'e′ taken by p: first find a detour in which p does nothing', ps: ['e′ is also taken by p, so e and e′ cannot swap. Use another idea: let p do nothing at all (treat it as the faulty process, so this is an admissible run); the protocol must still let the others go on until someone decides. Call these steps σ, leading from C₀ to A.'] },
    { h: 'The same σ also fits after D₀ and D₁', ps: ['σ has no step of p, while e and e′ are both taken by p, so they do not affect each other and σ also fits after D₀ and D₁, giving E₀ and E₁. A settled outcome never changes, so E₀ can only decide 0 and E₁ can only decide 1.'] },
    { h: 'Doing e from A gives E₀', ps: ['A is C₀ after σ, and E₀ is C₀ after e and then σ. σ and e are taken by different processes and swap, so A followed by e is E₀.'] },
    { h: 'Doing e′ and then e from A gives E₁', ps: ['Likewise, A followed by e′ gives A′, and then e gives E₁, which is C₁ after e and then σ.'] },
    { h: 'A is bivalent', ps: ['From A we can reach E₀ (only 0) and E₁ (only 1), so both outcomes are still possible at A: A is bivalent.'] },
    { h: 'Contradiction', ps: ['But A is the end of a deciding run: some process is already in a decision state, so both outcomes cannot still be possible.'], result: 'So "the neighboring step is also taken by p" cannot happen either.', bad: true },
  ],
};
export const CASES = (l: Lang) => (l === 'en' ? casesEn : casesZh);

// ---------------------------------------------------------------- 圖 C：永遠不決定的執行

interface StagesStrings {
  aria: string;
  play: string;
  reset: string;
  withhold: string;
  stageLbl: (k: number) => string;
  hintIdle: string;
  zone0: string; zone1: string; band1: string; band2: string;
  danger: string;
  turnsTitle: string;
  withholdNote: string;
  withholdMsg: (m: string, p: string) => string;
  caption: (k: number, head: string) => string;
  captionW: (k: number) => string;
  intro: string;
  turns: string;
  turnsOf: (p: string, k: number) => string;
  pending: string;
  bufferEmpty: string;
  waited: (k: number) => string;
  verdictFair: string;
  verdictWithhold: (m: string, p: string) => string;
  noteStop: string;
  heading: (k: number) => string;
  legendBand: string; legendTurn: string; legendDanger: string;
}
const stagesZh: StagesStrings = {
  aria: '永遠不決定的執行：上面是一路停在「兩種結局都還有可能」的路徑，下面是每個階段輪到誰收訊息',
  play: '播放',
  reset: '重設',
  withhold: '扣住一則訊息',
  stageLbl: (k) => `階段 ${k}`,
  hintIdle: '「下一步」多走一個階段。可以試試「扣住一則訊息」，看哪種排程不算容許。',
  zone0: '決定 0', zone1: '決定 1', band1: '未定區：', band2: '兩種結局都還有可能',
  danger: '這樣送會把結果定下來',
  turnsTitle: '每個階段，輪到誰收最早的訊息',
  withholdNote: '這個排程不是引理 3 的建構，所以不畫未定區的路徑',
  withholdMsg: (m, p) => `${p} 一直在走，但 ${m} 永遠沒送給它`,
  caption: (k, head) => (k === 0 ? '起點：一個 bivalent 的初始配置（引理 2）' : `階段 ${k}：輪到 ${head} 收它最早的訊息，系統仍在未定區`),
  captionW: (k) => (k === 0 ? '起點' : `階段 ${k}：有一則訊息被一直扣住`),
  intro: '上面：每一格是一個階段。系統一路待在中間的未定區，虛線是被繞開的危險一步，照那樣送訊息，結果就會定下來，掉進「決定 0」或「決定 1」。下面：每個階段，佇列最前面的 process 輪到收它最早的訊息（金點），所以每個 process 一直有機會走，每則訊息遲早被收到。',
  turns: '輪到次數',
  turnsOf: (p, k) => `${p} 輪到 ${k} 次`,
  pending: '還沒送到的訊息',
  bufferEmpty: '（沒有）',
  waited: (k) => `等了 ${k} 階段`,
  verdictFair: '容許：每個 process 都一直輪得到，每則訊息遲早被收到，沒有 process 故障。可是沒有任何 process 進入決定狀態。',
  verdictWithhold: (m, p) => `不容許：${p} 一直在走，訊息 ${m} 卻永遠不送給它。容許執行要求所有送給未故障 process 的訊息最終都送達。`,
  noteStop: '對照：如果 p₃ 乾脆完全不動，它就算那一個故障的 process，送給它的訊息不必送達，這樣也是容許的。但 FLP 的建構不需要這一步，沒有任何 process 停止，也能永遠不決定。',
  heading: (k) => (k === 0 ? '還沒開始' : `走了 ${k} 個階段，沒有人決定`),
  legendBand: '兩種結局都還有可能（bivalent）',
  legendTurn: '輪到它收最早的訊息',
  legendDanger: '會把結果定下來的送法（被繞開）',
};
const stagesEn: StagesStrings = {
  aria: 'A run that never decides: above, a path that stays in the region where both outcomes are still possible; below, who receives a message in each stage',
  play: 'Play',
  reset: 'Reset',
  withhold: 'Withhold one message',
  stageLbl: (k) => `Stage ${k}`,
  hintIdle: 'Next adds one more stage. Try "Withhold one message" to see which schedule is not admissible.',
  zone0: 'decide 0', zone1: 'decide 1', band1: 'undecided region:', band2: 'both outcomes still possible',
  danger: 'delivering like this would settle the outcome',
  turnsTitle: 'In each stage, who receives its earliest message',
  withholdNote: 'This schedule is not the Lemma 3 construction, so no path in the undecided region is drawn',
  withholdMsg: (m, p) => `${p} keeps stepping, but ${m} is never delivered to it`,
  caption: (k, head) => (k === 0 ? 'Start: a bivalent initial configuration (Lemma 2)' : `Stage ${k}: ${head} receives its earliest message, and the system is still undecided`),
  captionW: (k) => (k === 0 ? 'Start' : `Stage ${k}: one message is held back forever`),
  intro: 'Above: each column is a stage. The system stays in the undecided region in the middle; the dashed arrows are the dangerous steps that get avoided, because delivering that way would settle the outcome and drop into "decide 0" or "decide 1". Below: in each stage the process at the head of the queue receives its earliest message (gold dot), so every process keeps getting turns and every message is eventually received.',
  turns: 'Turns',
  turnsOf: (p, k) => `${p}: ${k} turn${k === 1 ? '' : 's'}`,
  pending: 'Undelivered messages',
  bufferEmpty: '(none)',
  waited: (k) => `waited ${k} stage${k === 1 ? '' : 's'}`,
  verdictFair: 'Admissible: every process keeps getting turns, every message is eventually received, no process is faulty. Yet no process ever enters a decision state.',
  verdictWithhold: (m, p) => `Not admissible: ${p} keeps stepping, yet message ${m} is never delivered to it. An admissible run requires every message sent to a non-faulty process to be received eventually.`,
  noteStop: 'For comparison: if p₃ simply never moved, it would count as the one faulty process, messages to it need not arrive, and that would be admissible. The FLP construction does not need this: it never decides even though no process stops.',
  heading: (k) => (k === 0 ? 'Not started' : `${k} stage${k === 1 ? '' : 's'} done, nobody has decided`),
  legendBand: 'both outcomes still possible (bivalent)',
  legendTurn: 'receives its earliest message',
  legendDanger: 'a way of delivering that would settle the outcome (avoided)',
};
export const STAGES = (l: Lang) => (l === 'en' ? stagesEn : stagesZh);

// ---------------------------------------------------------------- 證明裡的小標籤

export interface ChipStrings {
  yours: string;
  counts: (n0: number, n1: number, nb: number) => string;
  pair: (c0: string, c1: string, p: number) => string;
  decide: (v: string) => string;
  contra: (v: string, side: string) => string;
  caseNow: string;
  sched: { fair: string; withhold: (m: string, p: string) => string };
  stages: (k: number) => string;
}
const chipsZh: ChipStrings = {
  yours: '你標的',
  counts: (a, b, c) => `只可能 0 的 ${a} 個、只可能 1 的 ${b} 個、兩種都可能的 ${c} 個`,
  pair: (c0, c1, p) => `C₀ = ${c0}、C₁ = ${c1}（只差 p${sub(p)}）`,
  decide: (v) => `你選 σ 決定 ${v}`,
  contra: (v, side) => `決定 ${v} → ${side} 被推翻 ✗`,
  caseNow: '圖上目前顯示這個情形',
  sched: { fair: '你的排程：輪流 ✓ 容許', withhold: (m, p) => `你的排程：扣住 ${m}（${p}）✗ 不容許` },
  stages: (k) => `圖上已走 ${k} 個階段，沒有人決定`,
};
const chipsEn: ChipStrings = {
  yours: 'your labels',
  counts: (a, b, c) => `${a} only-0, ${b} only-1, ${c} both-possible`,
  pair: (c0, c1, p) => `C₀ = ${c0}, C₁ = ${c1} (differ in p${sub(p)})`,
  decide: (v) => `you chose σ decides ${v}`,
  contra: (v, side) => `deciding ${v} → ${side} refuted ✗`,
  caseNow: 'this case is currently shown in the figure',
  sched: { fair: 'your schedule: round robin ✓ admissible', withhold: (m, p) => `your schedule: withhold ${m} (${p}) ✗ not admissible` },
  stages: (k) => `the figure has run ${k} stage${k === 1 ? '' : 's'}; nobody has decided`,
};
export const CHIPS = (l: Lang) => (l === 'en' ? chipsEn : chipsZh);
