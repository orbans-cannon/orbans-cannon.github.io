/** FLM 互動圖（連通度，四個節點一道牆）的字串。通用的按鈕、圖例、判定語句沿用 strings.ts 的 ctStrings。 */
import type { Lang, StepText } from './strings';

export interface WallStrings {
  aria: string;
  sTitle: string;
  sTitlePending: string;
  gTitle: string;
  wall: string;
  path: (i: number) => string;
  steps: StepText[];
  bad2: (zeros: string[], ones: string[]) => string;
  roles: [string, string, string];
}

const zh: WallStrings = {
  aria: '覆蓋圖與現實系統並列的互動圖：連通度 2 的圖（四個節點、一道牆）的證明，共 8 步',
  sTitle: '覆蓋圖 S（八個節點）',
  sTitlePending: '覆蓋圖 S（還沒造）',
  gTitle: '現實 G（四個節點）',
  wall: '牆 {b, d}',
  path: (i) => `路 ${i}`,
  roles: ['d 故障', 'b 故障', 'd 故障'],
  steps: [
    {
      title: '從現實出發：節點夠了，連通度不夠',
      body: [
        '假設裝置 A、B、C、D 能在右邊的 G 上解決 BA（至多 1 個故障）。G 有 4 個節點，剛好是 3m+1，節點數沒有問題；但是拿掉 b 與 d，a 與 c 就彼此分離，連通度是 2，不到 2m+1，a 與 c 彼此的一切資訊都得經過這道牆。',
        '換個角度看，連通度就是 a 到 c 之間互不相交的路最多有幾條：這裡只有 a–b–c 與 a–d–c 兩條（圖上的路 1、路 2）。b 與 d 其中一個是叛徒時，a 聽到的是兩個互相矛盾的版本，卻沒有依據判斷哪個是真的；要靠多數決擋住 1 個叛徒，需要 3 條路。',
        '做法和 n=3 時一樣：先造一個局部看起來和 G 一模一樣的覆蓋圖 S，再從 S 切出三個情景，只是這一次故障節點永遠是牆上的節點。',
      ],
    },
    {
      title: '複製兩份，輸入分別是 1 與 0',
      body: [
        '把 G 複製兩份，每份仍然跑 A、B、C、D。上半的一份輸入全是 1，記為 A₁、B₁、C₁、D₁；下半的一份輸入全是 0，記為 A₀、B₀、C₀、D₀。下標同時是複本編號與輸入。',
        '目前它們還是兩個互不相干的 G，每份都有 A–D 這條邊（A₁–D₁ 與 A₀–D₀）。',
      ],
    },
    {
      title: '在 a 與牆之間交叉重接',
      body: [
        '剪斷 A₁–D₁ 與 A₀–D₀，改接 A₀–D₁ 與 A₁–D₀。每個節點仍然擁有與它在 G 裡同名節點一樣的鄰居，例如 A 有一個 B 與一個 D，所以 S 覆蓋 G。換句話說，我們只在 a 與牆之間的邊上，把兩份複本拼接起來。',
        '右邊每個節點旁標出它在 S 裡對應的節點。把滑鼠移到 S 的節點上（或用 Tab 聚焦），可以看到它在 G 裡對應的節點與鄰居。',
      ],
    },
    {
      title: '排練：在 S 上跑一遍',
      body: [
        '把裝置裝進 S，所有節點都照程式誠實地跑。S 不是 G 的系統，Agreement 與 Validity 在 S 上沒有任何保證；但系統是確定性的，每個節點仍然會決定出某個值，只是我們不知道是什麼。',
        '點一下 S 的節點，替它填一個決定（？→ 0 → 1），自己扮演那組裝置。接下來三步會告訴你，不管怎麼填，哪一關都擋得住。',
      ],
    },
    {
      title: 'ℰ₁：d 是故障節點，取出 (A₀, B₀, C₀)',
      lines: [
        { k: 'Fault', t: 'd 對 a 重播 D₁ 對 A₀ 說的話，對 b、c 重播 D₀ 對 B₀、C₀ 說的話。這個裝置依 Fault 公理存在。' },
        { k: 'Locality', t: 'a、b、c 收到的訊息和 A₀、B₀、C₀ 完全相同，所以行為也相同。' },
        { k: 'Validity', t: '正確節點 a、b、c 的輸入都是 0，所以它們必須選 0。' },
      ],
      result: '所以 S 裡的 A₀、B₀、C₀ 都決定 0。',
    },
    {
      title: 'ℰ₂：b 是故障節點，取出 (C₀, D₀, A₁)',
      lines: [
        { k: 'Fault', t: 'b 對 c、d 重播 B₀ 對 C₀、D₀ 說的話，對 a 重播 B₁ 對 A₁ 說的話。' },
        { k: 'Locality', t: 'c、d、a 的行為分別與 C₀、D₀、A₁ 相同；其中 C₀ 在上一步已經決定 0。' },
        { k: 'Agreement', t: 'c、d、a 都是正確節點，必須選同一個值，所以 d、a 也選 0。' },
      ],
      result: '所以 S 裡的 D₀、A₁ 都決定 0。',
    },
    {
      title: 'ℰ₃：d 是故障節點，取出 (A₁, B₁, C₁)',
      lines: [
        { k: 'Fault', t: 'd 對 a 重播 D₀ 對 A₁ 說的話，對 b、c 重播 D₁ 對 B₁、C₁ 說的話。' },
        { k: 'Locality', t: 'a、b、c 的行為分別與 A₁、B₁、C₁ 相同。' },
        { k: 'Validity', t: '正確節點 a、b、c 的輸入都是 1，所以它們必須選 1。' },
      ],
      result: '所以 S 裡的 A₁、B₁、C₁ 都決定 1，但上一步說 A₁ 決定 0。',
    },
    {
      title: '串接：矛盾',
      body: [
        '三個執行各自只有一個故障節點（b 或 d，都在牆上），各自都是 G 上合法的執行。ℰ₁ 與 ℰ₂ 共用 C₀，ℰ₂ 與 ℰ₃ 共用 A₁：Agreement 把 0 從 C₀ 傳到 A₁，Validity 卻把 A₁ 釘在 1。',
        'A₁ 不可能同時決定 0 與 1，所以 ℰ₁、ℰ₂、ℰ₃ 至少有一個違反保證。是哪一個，取決於裝置怎麼寫，證明不需要知道。',
      ],
    },
  ],
  bad2: (z, o) => `ℰ₂ 違反 Agreement：${z.join('、')} 決定 0、${o.join('、')} 決定 1，對應的 c、d、a 都是正確節點，卻選了不同的值。`,
};

const en: WallStrings = {
  aria: 'Interactive figure placing the covering graph beside the real system: the connectivity-2 proof (four nodes, one wall) in 8 steps',
  sTitle: 'Covering graph S (eight nodes)',
  sTitlePending: 'Covering graph S (not built yet)',
  gTitle: 'Reality G (four nodes)',
  wall: 'wall {b, d}',
  path: (i) => `path ${i}`,
  roles: ['d is Byzantine', 'b is Byzantine', 'd is Byzantine'],
  steps: [
    {
      title: 'Start from reality: enough nodes, not enough connectivity',
      body: [
        'Suppose devices A, B, C, D solve BA on the graph G on the right (at most one fault). G has 4 = 3m+1 nodes, so the node count is fine; but removing b and d separates a from c. The connectivity is 2, below 2m+1, and everything a and c learn about each other passes through this wall.',
        'Seen another way, connectivity is the largest number of node-disjoint paths from a to c: here only a–b–c and a–d–c (path 1 and path 2 in the figure). When one of b, d is a traitor, a hears two conflicting versions and has no way to tell which is true; to outvote one traitor by majority, three paths are needed.',
        'The plan is the same as for n=3: build a covering graph S that looks locally like G, then cut three scenarios out of S. This time the faulty node is always a wall node.',
      ],
    },
    {
      title: 'Copy it twice, with inputs 1 and 0',
      body: [
        'Make two copies of G, each still running A, B, C, D. The upper copy has input 1 everywhere and is written A₁, B₁, C₁, D₁; the lower copy has input 0 everywhere and is written A₀, B₀, C₀, D₀. The subscript is both the copy and the input.',
        'For now they are two unrelated copies of G, each with its A–D edge (A₁–D₁ and A₀–D₀).',
      ],
    },
    {
      title: 'Cross-wire between a and the wall',
      body: [
        'Cut A₁–D₁ and A₀–D₀, then connect A₀–D₁ and A₁–D₀. Every node still has the same neighbours as its namesake in G (for instance A has one B and one D), so S covers G. In other words, we splice the two copies only along the edges between a and the wall.',
        'Next to each node of G is the set of S-nodes that map to it. Hover over (or Tab to) a node of S to see its image and neighbours in G.',
      ],
    },
    {
      title: 'Rehearsal: run the devices on S',
      body: [
        'Install the devices on S; every node runs its program honestly. S is not a system of G, so Agreement and Validity promise nothing on it. But the system is deterministic, so every node still decides some value; we just do not know which.',
        'Click a node of S to fill in a decision (? → 0 → 1) and play the devices yourself. The next three steps show that, however you fill them in, one of the checks catches you.',
      ],
    },
    {
      title: 'ℰ₁: d is Byzantine; take (A₀, B₀, C₀)',
      lines: [
        { k: 'Fault', t: 'd shows a what D₁ showed A₀, and shows b, c what D₀ showed B₀, C₀. By the Fault axiom such a device exists.' },
        { k: 'Locality', t: 'a, b, c receive exactly what A₀, B₀, C₀ received, so they behave the same.' },
        { k: 'Validity', t: 'The correct nodes a, b, c all have input 0, so they must choose 0.' },
      ],
      result: 'So A₀, B₀, C₀ all decide 0 in S.',
    },
    {
      title: 'ℰ₂: b is Byzantine; take (C₀, D₀, A₁)',
      lines: [
        { k: 'Fault', t: 'b shows c, d what B₀ showed C₀, D₀, and shows a what B₁ showed A₁.' },
        { k: 'Locality', t: 'c, d, a behave like C₀, D₀, A₁; C₀ already decided 0 in the previous step.' },
        { k: 'Agreement', t: 'c, d, a are all correct, so they must agree: d and a also choose 0.' },
      ],
      result: 'So D₀ and A₁ both decide 0 in S.',
    },
    {
      title: 'ℰ₃: d is Byzantine; take (A₁, B₁, C₁)',
      lines: [
        { k: 'Fault', t: 'd shows a what D₀ showed A₁, and shows b, c what D₁ showed B₁, C₁.' },
        { k: 'Locality', t: 'a, b, c behave like A₁, B₁, C₁.' },
        { k: 'Validity', t: 'The correct nodes a, b, c all have input 1, so they must choose 1.' },
      ],
      result: 'So A₁, B₁, C₁ all decide 1 in S, yet the previous step said A₁ decides 0.',
    },
    {
      title: 'Chain them: contradiction',
      body: [
        'Each execution has only one faulty node (b or d, both on the wall), so each is a legal execution of G. ℰ₁ and ℰ₂ share C₀, and ℰ₂ and ℰ₃ share A₁: Agreement carries 0 from C₀ to A₁, while Validity pins A₁ to 1.',
        'A₁ cannot decide both 0 and 1, so at least one of ℰ₁, ℰ₂, ℰ₃ violates the guarantee. Which one depends on how the devices are written; the proof never needs to know.',
      ],
    },
  ],
  bad2: (z, o) => `ℰ₂ violates Agreement: ${z.join(', ')} decided 0 and ${o.join(', ')} decided 1, so the matching correct nodes c, d, a choose different values.`,
};

export const wallStrings: Record<Lang, WallStrings> = { 'zh-TW': zh, en };
