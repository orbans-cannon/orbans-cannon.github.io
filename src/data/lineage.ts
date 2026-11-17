/**
 * 概念家族樹（<Lineage id="…" />）的資料來源。規則見 CLAUDE.md §8「論文分類與頁面組織規則」。
 *
 * 結構（2026-11-17 起）：
 * - `papers`：每篇論文一份，全站唯一。`read` 是讀過程度，`href` 是主頁（主結果所在的頁，可帶 #錨點），
 *   沒有 refs.ts 條目的論文要寫 `label`。
 * - `edgeDefs`：每條邊只定義一次，鍵是 'from>to'。各棵樹的 `edges` 只列出要畫哪幾條。
 * - 每棵樹的 `nodes` 只放這棵樹自己的東西：位置、`role`、一行重點 `tag`，以及（需要時）蓋過論文主頁的 `href`。
 *
 * `read`（讀過程度，每篇論文一個值）：
 *   none      沒有讀（沒有原文，或只在別的論文裡看到）
 *   abstract  讀過摘要、引言、相關工作
 *   body      讀過主要定理與結果（定理敘述、結果表、主要演算法或實驗結果），證明沒讀
 *   proof     讀過證明
 *   reviewed  作者審過
 *   none／abstract 的節點畫虛線框；碰到它的邊不能自己下結論，只能留空，或用 `via` 轉述某篇 body 級以上的論文怎麼說。
 *   `<Cite>` 的門檻是 body 以上，且 refs.ts 的 note 要與這裡一致（讀到 body 的，note 寫「讀過摘要與主要定理，證明未讀」）。
 *   「對照過」指實際看過原文並核對這條邊的說法；不要因為書目核對過就標 body。
 *
 * `role`（這棵樹裡的角色，每棵樹各自標，只影響圖怎麼畫）：
 *   spine（主幹）拿掉它這棵樹的主線會斷；bridge（銜接）缺了它讀者會問這一步從哪來；outer（外圍）只需知道它存在。
 *   頁面寫多深（完整頁／導讀頁／索引項）由論文主頁 frontmatter 的 `depth` 決定，與 `role` 無關。
 *
 * 邊的類型：
 *   refine   改進（放寬假設、提高容錯、降低成本）
 *   respond  回應前一篇留下的限制或缺口（不一定更強，換一條路）
 *   tight    同一個模型下達到下界（追平）；不是鬆開假設，圖上用另一種線型
 *   related  本站為了串起模型畫的對應（後者沒有引用前者，不是繼承）；不能有 key
 *   unchecked  關係待核對（沒有內容）
 *   顏色不用來區分類型（顏色只代表時序），改用線型。
 * - `key`（關鍵改動）：這一步換掉或放寬了什麼，約 7 字以內；只能出現在 refine、respond、tight。
 *   一個節點收到多條帶 key 的邊時全部列出，所以要短。
 * - 每條有內容的邊要有 `evidence`（出處，維護用，不顯示）。原文的數字要連同度量一起寫
 *   （DAG 輪、通訊輪、message delay、words、authenticators、messages 彼此不能直接比）。
 * - 橫向（col）是「站在誰的肩上」的世代，不是出版年份。
 * - 樹自帶審查狀態 `status`（目前全部 draft），顯示在圖的標題列，與頁面 badge 分開。
 * - 跨樹的連線不畫在圖上，寫在 `cross`；樹內但畫不出的並列關係寫在 `notes`。
 * - 字串可含 $...$（renderInline 渲染）。
 * 家族樹資料由全站對話批次更新，頁面對話不改（見 CLAUDE.md §8.4）。
 */

export type Role = 'spine' | 'bridge' | 'outer';
export type ReadLevel = 'none' | 'abstract' | 'body' | 'proof' | 'reviewed';
export type EdgeKind = 'refine' | 'respond' | 'tight' | 'related' | 'unchecked';
export type TreeStatus = 'draft' | 'reviewed';

export interface Paper {
  /** 沒有 refs.ts 條目時的顯示名稱（有條目時不要寫） */
  label?: string;
  read: ReadLevel;
  /** 主頁：主結果所在的頁，可帶 #錨點；沒有頁面就不寫 */
  href?: string;
}

export interface TreeNode {
  ref: string;
  /** 世代（0 起算）與列（可為小數） */
  col: number;
  row: number;
  role: Role;
  /** 節點上的一行重點（要短，≤ 約 14 個中文字寬） */
  tag: string;
  /** 這棵樹蓋過論文主頁的連結（例如同步樹的 Rabin 連到同步的那一段） */
  href?: string;
}

export interface Edge {
  from: string;
  to: string;
  kind: EdgeKind;
  key?: string;
  /** 這一步改了什麼。碰到 body 以下的節點時：留空，或用 via 轉述 */
  change?: string;
  /** 轉述來源（必須是 body 級以上的論文）；顯示成「（依 X 的敘述）」 */
  via?: string;
  /** 出處（維護用，不顯示） */
  evidence?: string;
}

export interface LineageQA {
  q: string;
  a: string;
}

export interface LineageCross {
  text: string;
  href: string;
  hrefLabel: string;
}

export interface Lineage {
  title: string;
  timing: 'sync' | 'partial' | 'async' | 'hybrid' | 'any';
  status: TreeStatus;
  concept: string;
  /** 圖例裡「關鍵改動」後面括號的說明（預設「這一步換掉或放寬的東西」；門與鑰匙那棵改成鑰匙的比喻） */
  keyNote?: string;
  caption: string;
  nodes: TreeNode[];
  /** 要畫的邊，鍵是 'from>to'，內容在 edgeDefs */
  edges: string[];
  notes?: string[];
  cross?: LineageCross[];
  qa: LineageQA[];
}

export const papers: Record<string, Paper> = {
  "abraham2019fc": { read: "body", href: "/sync/randomized/" },
  "aleph2019": { read: "body" },
  "autobahn2024": { read: "body" },
  "avid2005": { read: "body", href: "/async/avid/" },
  "benor1983": { read: "body", href: "/async/ben-or/" },
  "bracha1987": { read: "body", href: "/async/bracha/" },
  "bullshark2022": { read: "body", href: "/convergence/bullshark/" },
  "ckps2001": { read: "body", href: "/async/vaba/" },
  "cks2000": { read: "proof", href: "/async/common-coin/" },
  "cogsworth2021": { read: "body", href: "/partial-sync/pacemaker/" },
  "cordial2023": { read: "body", href: "/convergence/uncertified-dag/" },
  "cr1993": { read: "body", href: "/async/ben-or/" },
  "dagrider2021": { read: "proof", href: "/convergence/dag-rider/" },
  "dls1988": { read: "body", href: "/impossibility/partial-sync/dls/" },
  "dr1985": { read: "body", href: "/impossibility/cost/dolev-reischuk/" },
  "ds1983": { read: "body", href: "/sync/dolev-strong/" },
  "fl1982": { read: "body", href: "/impossibility/sync/round-bound/" },
  "flm1986": { read: "reviewed", href: "/impossibility/sync/flm/" },
  "flp1985": { read: "proof", href: "/impossibility/async/flp/" },
  "fm1997": { read: "body", href: "/sync/randomized/" },
  "goodcase2021": { read: "body", href: "/impossibility/cost/good-case/" },
  "honeybadger2016": { read: "body", href: "/async/honeybadger/" },
  "hotstuff2019": { read: "body", href: "/partial-sync/hotstuff/" },
  "jolteon2022": { read: "body", href: "/partial-sync/two-chain/" },
  "katzkoo2006": { read: "body", href: "/sync/randomized/" },
  "lsp1982": { read: "body" },
  "martin-alvisi": { label: "Martin–Alvisi 2006", read: "none" },
  "mmr2015": { read: "body", href: "/async/mmr/" },
  "momose2021": { read: "body" },
  "mysticeti2025": { read: "body", href: "/convergence/uncertified-dag/" },
  "narwhal2022": { read: "proof", href: "/convergence/narwhal-tusk/" },
  "pbft2002": { read: "body", href: "/partial-sync/pbft/" },
  "psl1980": { read: "body" },
  "rabin1983": { read: "body", href: "/async/ben-or/" },
  "raresync2024": { read: "body", href: "/partial-sync/pacemaker/" },
  "sailfish2025": { read: "body" },
  "shoal2024": { read: "body" },
  "shoalpp2025": { read: "body" },
  "simplex2023": { read: "body", href: "/partial-sync/two-chain/" },
  "synchs2020": { read: "body", href: "/sync/sync-hotstuff/" },
  "tendermint2018": { read: "body", href: "/partial-sync/two-chain/" },
  "vaba2019": { read: "body", href: "/async/vaba/" },
};

export const edgeDefs: Record<string, Edge> = {
  "psl1980>lsp1982": {
    from: "psl1980",
    to: "lsp1982",
    kind: "refine",
    key: "簽章",
    change: "PSL 已證明 $n\\ge 3m+1$ 必要且充分，並指出若故障者只能拒絕轉送、不能偽造，任意 $n$ 都可解。LSP 把「不能偽造」寫成明確的簽章假設，給出口頭訊息的演算法（$n\\ge 3m+1$），以及容忍任意數量叛徒的簽章演算法。",
    evidence: "PSL 摘要；LSP 摘要、§3、§4（A4：簽章不可偽造）。",
  },
  "psl1980>flm1986": {
    from: "psl1980",
    to: "flm1986",
    kind: "refine",
    change: "FLM 用覆蓋圖重新證明 PSL 已證的 $3m+1$ 節點下界（原文說新證明更簡單、適用的模型更一般），並把先前只有 Dolev 非正式證明的連通度 $2m+1$ 下界正式證出。他們的 Fault 公理一旦被明顯削弱，例如加上不可偽造的簽章（LSP 的簽章設定就是這類），這些不可能結果就不成立。Dolev 1982 的原文本站還沒讀，所以不畫成節點。",
    evidence: "FLM 摘要與 §1（3m+1 previously proved by [12] = PSL；2m+1 presented informally in [5] = Dolev）、Fault 公理一段（unforgeable signature assumption）。",
  },
  "lsp1982>ds1983": {
    from: "lsp1982",
    to: "ds1983",
    kind: "refine",
    key: "簽章",
    change: "Dolev–Strong 研究的是 PSL、LSP 提出的簽章（認證）設定：故障者只能不轉送，不能偽造。他們證明即使如此仍要 $f+1$ 輪，並給出訊息數是 $n$ 與 $f$ 的多項式的演算法，最好的一個是 $f+1$ 輪、$O(nf)$ 訊息（只算正確節點送的訊息）；每個節點最多轉送兩個不同值的限制版是 $O(n^2)$ 訊息（原文 Theorem 3），但每則訊息最多帶 $f+1$ 個簽章，所以通訊量更大（這一點是 Momose–Ren 的說法）。",
    evidence: "Dolev–Strong 摘要與 §1。",
  },
  "fl1982>rabin1983": {
    from: "fl1982",
    to: "rabin1983",
    kind: "respond",
    key: "隨機化",
    change: "確定性協議至少要 $f+1$ 輪；Rabin 用隨機化讓期望輪數固定且很小，與 $n$、$t$ 無關。這不違反下界，因為下界只針對確定性協議。",
    evidence: "Rabin 摘要；Sync HotStuff §related work（matches the lower bound for deterministic protocols … randomized protocols have been introduced）。",
  },
  "rabin1983>fm1997": {
    from: "rabin1983",
    to: "fm1997",
    kind: "refine",
    key: "免 dealer",
    change: "Rabin 的做法要事先有誠實的 dealer，發好公鑰與共享秘密。Feldman–Micali 在同步網路下不靠任何外部可信第三方，期望常數輪就達成 BA，容忍至多 $1/3$ 的故障。",
    evidence: "Rabin 摘要（non-faulty Dealer）；Feldman–Micali 摘要（without relying on any external trusted party … expected constant number of rounds）。",
  },
  "flp1985>benor1983": {
    from: "flp1985",
    to: "benor1983",
    kind: "respond",
    key: "隨機化",
    change: "FLP 證明確定性協議必有不終止的執行；Ben-Or 用隨機化讓不終止成為機率 0 的事件。",
    evidence: "Ben-Or §1（引 FLP 為既有結果，「guarantees … probability 1」）；VABA §1（Ben-Or shows randomization makes non-terminating executions probability 0）。",
  },
  "flp1985>dls1988": {
    from: "flp1985",
    to: "dls1988",
    kind: "respond",
    key: "部分同步",
    change: "依 DLS 的引言：Dolev 等人建立在 FLP 之上，證明只要延遲上界不存在（非同步）或處理器相對速度上界不存在，就無法在任何故障下達成共識。DLS 考慮兩種中間情形：上界存在但事先不知道，或上界只在某個未知時間（GST）之後才成立；它指出這些不可能結果不適用，因為通訊實際上是同步的，並給出各種部分同步與故障模型下的協議，以及在大多數情形下顯示協議容錯最佳的下界。",
    evidence: "DLS 摘要與引言（Dolev et al. [4], building on Fischer et al. [10]；the impossibility results … do not apply since communication is, in fact, synchronous）。",
  },
  "dr1985>momose2021": {
    from: "dr1985",
    to: "momose2021",
    kind: "tight",
    key: "同步追平",
    change: "Momose–Ren 的引言說二次通訊是 BA 最壞情況的必要條件（Dolev–Reischuk 的下界），在無簽章、$f<n/3$ 時已被 Berman 等人證明是緊的，但簽章、$n/3\\le f<n/2$ 之間仍有缺口：Dolev–Strong 雖然只用二次的訊息數，通訊量卻是三次，因為訊息最多帶 $f+1$ 個簽章。他們給兩個二次通訊的協議：最佳容錯 $f<n/2$（要門檻簽章的 trusted setup），以及在標準 PKI 下接近最佳的 $f\\le(1/2-\\varepsilon)n$。度量要分清楚：Dolev–Reischuk 的下界數的是訊息數與簽章數，Momose–Ren 的上界數的是 bits，$O(\\kappa n^2)$，差一個安全參數 $\\kappa$；Momose–Ren 自己說這個二次通訊對應 Dolev–Reischuk 的下界。",
    evidence: "Momose–Ren 摘要與 §1（Dolev-Strong … quadratic messages but cubic communication）。",
  },
  "goodcase2021>simplex2023": {
    from: "goodcase2021",
    to: "simplex2023",
    kind: "related",
    change: "本站畫的對應：Simplex 的分析框架引用 Good-case Latency，說 proposal confirmation time $3\\delta$ 在 $f\\ge (n+2)/5$ 時是最佳的。Good-case Latency 自己的 Theorem 2 與 Theorem 4：部分同步下兩輪的 Byzantine broadcast 可能，若且唯若 $n\\ge 5f-1$；$f\\ge (n+2)/5$ 時至少要 3 輪。也就是說，延遲這道門的鑰匙是節點數。",
    evidence: "Good-case Latency 摘要、Theorem 2、Theorem 4；Simplex §1（ANRX21 的引用，$f\\ge (n+2)/5$）。",
  },
  "martin-alvisi>mysticeti2025": {
    from: "martin-alvisi",
    to: "mysticeti2025",
    kind: "tight",
    key: "3 輪下界",
    via: "mysticeti2025",
    change: "依 Mysticeti 的說法：Mysticeti-C 在穩態與 crash 故障下，在已知下界的 3 個 message round 內 commit，這個下界引自 Martin–Alvisi 的 fast BFT；Mysticeti 說的最佳是指不用樂觀路徑的情形。這個「3 輪」只在 $n<5f-1$ 的設定成立：本站讀到的 Good-case Latency 指出，$n\\ge 5f-1$ 時部分同步下兩輪就可能。Martin–Alvisi 的原文本站還沒讀。",
    evidence: "Mysticeti 摘要與 §I（committing blocks within the known lower bound [21] of 3 message rounds；[21] = Martin–Alvisi）。",
  },
  "dr1985>raresync2024": {
    from: "dr1985",
    to: "raresync2024",
    kind: "tight",
    key: "部分同步追平",
    change: "RareSync 論文說 Dolev–Reischuk 的下界是確定性 BA 最壞要二次通訊（words）；同步下已證明是緊的，但部分同步下有沒有二次通訊的協議一直未知，當時最有效率的（HotStuff、binary DBFT）是三次。它給出 view synchronization 協議 RareSync 與基於它的 SQuad，容錯最佳 $f<n/3$，worst-case 通訊 $O(n^2)$ words、延遲 $O(f\\cdot\\delta)$（通訊只計 GST 之後送出的 words，延遲自 GST 起算）。",
    evidence: "RareSync 摘要。",
  },
  "ds1983>synchs2020": {
    from: "ds1983",
    to: "synchs2020",
    kind: "related",
    change: "本站為了比較而畫的對應：Sync HotStuff 在 related work 把 Dolev–Strong 當作 $f<n$、$f+1$ 輪的確定性 BB 代表；它泛指現有同步協議輪數多、又要求 lock-step，並沒有單獨指名 Dolev–Strong。它改用穩定 leader 做 SMR：穩定狀態延遲 $2\\Delta + O(\\delta)$、不需要 lock-step、容忍 $f<n/2$。兩者問題不同：Dolev–Strong 是 BB，Sync HotStuff 是 SMR。",
    evidence: "Sync HotStuff 摘要與 §I、§related work（Dolev and Strong gave a deterministic protocol … f < n）；複查報告第 13 項。",
  },
  "ds1983>momose2021": {
    from: "ds1983",
    to: "momose2021",
    kind: "respond",
    key: "二次通訊",
    change: "Momose–Ren 的引言說二次通訊是 BA 最壞情況的必要條件（Dolev–Reischuk 的下界），在無簽章、$f<n/3$ 時已被 Berman 等人證明是緊的，但簽章、$n/3\\le f<n/2$ 之間仍有缺口：Dolev–Strong 雖然只用二次的訊息數，通訊量卻是三次，因為訊息最多帶 $f+1$ 個簽章。他們給兩個二次通訊的協議：最佳容錯 $f<n/2$（要門檻簽章的 trusted setup），以及在標準 PKI 下接近最佳的 $f\\le(1/2-\\varepsilon)n$。度量要分清楚：Dolev–Reischuk 的下界數的是訊息數與簽章數，Momose–Ren 的上界數的是 bits，$O(\\kappa n^2)$，差一個安全參數 $\\kappa$；Momose–Ren 自己說這個二次通訊對應 Dolev–Reischuk 的下界。",
    evidence: "Momose–Ren 摘要與 §1（Dolev-Strong … quadratic messages but cubic communication）。",
  },
  "fm1997>katzkoo2006": {
    from: "fm1997",
    to: "katzkoo2006",
    kind: "refine",
    key: "t<n/2",
    change: "Feldman–Micali 的做法不容易推到 $t<n/2$。Katz–Koo 在 $t<n/2$、只靠簽章與 PKI 的條件下做到期望常數輪，並引入 moderated VSS，也讓 Feldman–Micali 的結果有較簡單的證明。他們指出較早的 Toueg 協議雖是期望 $O(1)$ 輪，但要有 trusted dealer。",
    evidence: "Katz–Koo 摘要與 §1（their approach does not readily extend to t<n/2；Toueg … assumes a trusted dealer）。",
  },
  "katzkoo2006>abraham2019fc": {
    from: "katzkoo2006",
    to: "abraham2019fc",
    kind: "refine",
    key: "10／16 輪",
    change: "Abraham 等人說同步、簽章、$f<n/2$ 的設定下，已知最好的協議是 Katz–Koo，期望 29 輪（且沒有分析通訊量）。他們做到期望 $O(1)$ 輪與期望 $O(n^2)$ 通訊（以簽章數計）：期望輪數在靜態對手下是 10、在強 rushing 適應性對手下是 16。但這兩個數字要依賴單輪的 common-coin 協議（16 輪要自適應安全的 coin）與門檻簽章，所以假設比只需簽章與 PKI 的 Katz–Koo 強；原文腳註並指出 Katz–Koo 的協議也可以用門檻簽章達到 $O(n^2)$ 通訊。這是 ePrint 版，不是出版版。",
    evidence: "Abraham 等 FC 2019 摘要與 §1（Katz and Koo … expected 29 rounds）。",
  },
  "dls1988>pbft2002": {
    from: "dls1988",
    to: "pbft2002",
    kind: "related",
    change: "兩者都把 safety 與 liveness 的假設分開：DLS 的模型是延遲上界未知、或 GST 之後才成立；PBFT 的 safety 完全不靠同步，liveness 只要求延遲 $\\text{delay}(t)$ 不比 $t$ 增長得更快。DLS 的協議也已經是輪流指派 phase、並用 lock 保住 safety。PBFT 沒有引用 DLS，這條邊是本站為了串起模型畫的對應，不是繼承。",
    evidence: "DLS §2.3 與協議描述（phase h belongs to p_i if h = i mod N；lock）；PBFT §2 Weak Synchrony、§3、§4.1；PBFT 全文沒有 DLS 的引用。",
  },
  "dls1988>tendermint2018": {
    from: "dls1988",
    to: "tendermint2018",
    kind: "refine",
    change: "Tendermint 自述受 PBFT 與 DLS（處理簽章故障的 Algorithm 2）啟發。和 DLS 一樣分輪進行，每一輪有專屬的 proposer（也叫 coordinator 或 leader），而且換到下一輪是正常流程的一部分，不是只在 proposer 出問題或被懷疑時才換（PBFT 是後者）。",
    evidence: "Tendermint §III 開頭（inspired by the PBFT SMR algorithm and the DLS algorithm for authenticated faults, Algorithm 2 from [6]；Similar to DLS algorithm, Tendermint proceeds in rounds）。",
  },
  "pbft2002>tendermint2018": {
    from: "pbft2002",
    to: "tendermint2018",
    kind: "refine",
    key: "免恢復模式",
    change: "每一輪的通訊模式很像 PBFT 的正常情況，條件良好時（正確的 proposer、通訊及時）三個通訊步驟決定，與 PBFT 相同。Tendermint 稱自己的主要新貢獻是新的 termination 機制：不需要額外通訊，因此只有一種執行模式，沒有 PBFT 類協議那種正常與恢復兩種模式的分離。這是預印本，未審稿（核對的是 arXiv v3）。",
    evidence: "Tendermint §III（The communication pattern of each round is very similar to the normal case of PBFT；The major novelty … new termination mechanism；single mode of execution）。",
  },
  "pbft2002>hotstuff2019": {
    from: "pbft2002",
    to: "hotstuff2019",
    kind: "refine",
    key: "多一階段",
    change: "PBFT 換 leader 時，新 leader 要轉送 $n-f$ 個 replica 各自最高的 QC：換 leader 的通訊是 $O(n^3)$，$O(n)$ 次換 leader 才做出一個決定時，authenticator 總數是 $O(n^4)$（用門檻簽章仍是 $O(n^3)$）。HotStuff 多加一個階段，讓新 leader 只挑自己知道的最高 QC，換 leader 與平常一樣只送 $O(n)$ 個 authenticator，並保有 optimistic responsiveness。",
    evidence: "HotStuff §1（view-change 段落；Linear View Change；O(n^3)、O(n^4)）。",
  },
  "tendermint2018>hotstuff2019": {
    from: "tendermint2018",
    to: "hotstuff2019",
    kind: "respond",
    via: "hotstuff2019",
    change: "HotStuff 指出 Tendermint 與 Casper 也是簡單的輪流 leader，但核心依賴同步：提案要等固定的最壞延遲，所以沒有 responsiveness。HotStuff 用三階段，讓新 leader 不必等 $\\Delta$ 也能安全提案；它的兩階段變體就會回到 Tendermint 的處境，需要在 Pacemaker 裡加等待最大延遲。",
    evidence: "HotStuff §1（Tendermint／Casper 的段落）、§4.4（two-phase 的 livelessness）、§6 末（two-phase variant）。",
  },
  "hotstuff2019>jolteon2022": {
    from: "hotstuff2019",
    to: "jolteon2022",
    kind: "refine",
    key: "2-chain",
    change: "Jolteon 是 HotStuff 的 2-chain 版：換成 quadratic 的 view-change，來降低標準 3-chain HotStuff 的延遲（相對於 HotStuff 的線性換 leader，換 leader 的通訊變多；原文指出實作的 pacemaker 本來就是二次，所以整體成本不變）。Ditto 再從 HotStuff 出發，用 asynchronous fallback 取代 view synchronization，原文稱不增加漸近成本，使協議在非同步與 DDoS 下仍有進展。",
    evidence: "Jolteon and Ditto 摘要。",
  },
  "hotstuff2019>cogsworth2021": {
    from: "hotstuff2019",
    to: "cogsworth2021",
    kind: "respond",
    key: "拆出同步",
    change: "Cogsworth 指出 HotStuff 把 view synchronization 的邏輯包在 Pacemaker 模組裡，但沒有形式定義，也沒有實作。Cogsworth 把它抽成獨立的 view synchronization 問題並形式化，給出樂觀線性通訊、常數延遲的演算法；原本做法的通訊是二次的，$O(n)$ 次換 leader 連鎖起來就成了 $O(n^3)$。",
    evidence: "Cogsworth 摘要、§1、附錄（PaceMaker abstraction presented in [HotStuff]；does not provide a formal definition … nor an implementation）。",
  },
  "hotstuff2019>raresync2024": {
    from: "hotstuff2019",
    to: "raresync2024",
    kind: "respond",
    key: "二次同步",
    change: "RareSync 指出 HotStuff 沒有明說 view synchronizer 怎麼做；採用 all-to-all 的做法時，要經過 $f+1$ 個 view 才遇到正確 leader，每個 view 的同步是 $O(n^2)$ words，整體是 $O(n^3)$（這是 RareSync 對 HotStuff 的歸納，腳註 3 說在 DiemBFT 實作上成立），所以 Dolev–Reischuk 的二次下界在部分同步下一直沒被追上。RareSync 的 view synchronization 通訊 $O(n^2)$、延遲 $O(f\\cdot\\delta)$，配上與 HotStuff 相同的 view core 得到 SQuad，worst-case 通訊 $O(n^2)$ words。這裡的 $O(n^3)$ 是 view synchronizer 的成本，與 HotStuff 自己數的 authenticator 度量不同，兩者不矛盾。",
    evidence: "RareSync 摘要、§1（S = (f+1)·O(n²) = O(n³)；footnote 3：HotStuff does not explicitly state how the view synchronizer works）、§SQuad。",
  },
  "jolteon2022>simplex2023": {
    from: "jolteon2022",
    to: "simplex2023",
    kind: "respond",
    key: "簡化協議",
    change: "Simplex 的分析框架指出：HotStuff 類的 pipelined 協議把 block time 降到 $2\\delta$，代價是 proposal confirmation time 變差，Jolteon 約 $5\\delta$、HotStuff 約 $7\\delta$，而且要連續幾個誠實 leader 才能確認；PBFT 是 $3\\delta$，但用穩定 leader。Simplex 在部分同步、$f<n/3$ 下給出更簡單的協議，原文稱效率達到甚至超過他們框架下的現有最好結果。",
    evidence: "Simplex 摘要與 §1（Proposal confirmation-time favoring／Block-time favoring）。",
  },
  "flp1985>rabin1983": {
    from: "flp1985",
    to: "rabin1983",
    kind: "respond",
    key: "預發 coin",
    change: "同樣繞過 FLP，但假設事先把一串 coin 可靠地分發給所有 process。",
    evidence: "Bracha §1（Rabin 的模型較強：initial stage 分發 coin 序列）；CKS §1（Rabin 與 Ben-Or 是最早的隨機化協議）。",
  },
  "benor1983>bracha1987": {
    from: "benor1983",
    to: "bracha1987",
    kind: "refine",
    key: "n/3 容錯",
    change: "Ben-Or 留下 $n/5\\le f<n/3$ 能否做到的開放問題；Bracha 把容錯做到 $f<n/3$，與下界吻合。",
    evidence: "Bracha §1（open problem 與 t<n/3 的說明）。",
  },
  "bracha1987>cr1993": {
    from: "bracha1987",
    to: "cr1993",
    kind: "refine",
    key: "AVSS",
    change: "Canetti–Rabin 指出 Bracha 是當時唯一已知、容錯最佳的非同步 BA，期望時間卻是指數。他們回答「有沒有快的、容錯最佳的非同步 BA」：做到 $f<n/3$，所有誠實 player 以壓倒性機率完成執行，而在「都完成」的條件下是期望常數時間（不是機率 1 終止）；faulty player 的運算能力不設限，用私有通道，不需要 dealer；核心是第一個容錯最佳的非同步 verifiable secret sharing（AVSS）。注意「唯一已知」只在這些條件下成立：需要 dealer 的 Toueg 等協議不算。後來 MMR 稱它是多項式，但位元複雜度很大；CKS 稱它不需要 dealer，但效率較差。",
    evidence: "Canetti–Rabin 摘要（The only known asynchronous … resilient BA protocol runs in expected exponential time；AVSS）；MMR §1（polynomial … huge bit complexity）；CKS §1.2（require no dealer at all）。",
  },
  "rabin1983>cks2000": {
    from: "rabin1983",
    to: "cks2000",
    kind: "respond",
    key: "一次設定",
    change: "預先分發的 coin 會用完，還要先把 coin 對應到交易；CKS 只在初始設定用 dealer，之後可以產生任意多個 coin。",
    evidence: "CKS §1.1（Rabin dealer 的兩個問題；setup 之後 virtually unlimited）。",
  },
  "bracha1987>mmr2015": {
    from: "bracha1987",
    to: "mmr2015",
    kind: "refine",
    key: "免簽章",
    change: "Bracha 沒有 common coin，期望輪數可能是指數；MMR 在給定 common coin 時，免簽章、$O(n^2)$ 訊息、期望常數輪。",
    evidence: "MMR §1（Bracha does not use a common coin … exponential）與標題。",
  },
  "cks2000>mmr2015": {
    from: "cks2000",
    to: "mmr2015",
    kind: "refine",
    change: "MMR 把 common coin 當成給定的元件，密碼學只留在 coin 那一層，共識那一層不再需要簽章。",
    evidence: "MMR §結論附近（cryptography is no longer needed at the upper layer）。",
  },
  "bracha1987>avid2005": {
    from: "bracha1987",
    to: "avid2005",
    kind: "refine",
    key: "糾刪碼",
    change: "AVID 說非同步 reliable broadcast 的標準做法是 Bracha 的協議；它從可驗證的資訊分散（糾刪碼加雜湊）出發，得到新的 RBC，在大輸入下把通訊量降低一個數量級。AVID 本身處理的是把檔案分散到 $n$ 個伺服器、其中至多三分之一拜占庭、client 也可能拜占庭的儲存問題。",
    evidence: "AVID 摘要、§1（standard implementation … Bracha's protocol；AVID-RBC；order of magnitude on large inputs）。",
  },
  "cks2000>ckps2001": {
    from: "cks2000",
    to: "ckps2001",
    kind: "refine",
    key: "多值 BA",
    change: "把 CKS 的二元協議歸約成 multi-valued 的 VABA（external validity），期望通訊 $O(n^3)$ words（依 VABA 的轉述；CKPS 原文以 bits 計）。",
    evidence: "VABA §1（Cachin et al. gave a reduction from their binary algorithm to VABA；O(n³)）。",
  },
  "ckps2001>vaba2019": {
    from: "ckps2001",
    to: "vaba2019",
    kind: "refine",
    key: "降通訊",
    change: "回答 CKPS 留下的開放問題：期望通訊從 $O(n^3)$ 降到漸近最佳的 $O(n^2)$ words（VABA 的度量；CKPS 原文以 bits 計）。",
    evidence: "VABA 摘要（addresses an open question of Cachin et al.; O(n³)→O(n²)）。",
  },
  "ckps2001>honeybadger2016": {
    from: "ckps2001",
    to: "honeybadger2016",
    kind: "refine",
    key: "門檻加密",
    change: "HoneyBadger 自稱是第一個漸近最佳的非同步 atomic broadcast，改進的對象就是 CKPS01：後者每個節點每筆 commit 的交易要傳 $O(N^2)$ bits。原因有二：節點之間重複工作（HoneyBadger 改用門檻加密防止審查攻擊），以及 ACS 的實作不佳（CKPS01 把 ACS 歸約到 MVBA，成本 $O(N^3|v|)$；HoneyBadger 改成 RBC 加 ABA）。",
    evidence: "HoneyBadger §1（significant efficiency improvements on … Cachin et al.）、§4（Instantiating ACS Efficiently）。",
  },
  "mmr2015>honeybadger2016": {
    from: "mmr2015",
    to: "honeybadger2016",
    kind: "refine",
    change: "HoneyBadger 的 ABA 用 Mostéfaoui 等人免簽章、基於 common coin 的協議（原文引的是 MMR 的 PODC 2014 版），期望常數時間；RBC 加 ABA 組成 ACS，這個歸約出自 Ben-Or–Kelmer–Rabin 1994，原本是為非同步多方安全計算做的。",
    evidence: "HoneyBadger §4（We instantiate this primitive with a protocol from Moustefaoui et al. [43]；Ben-Or et al. [9]）。",
  },
  "aleph2019>dagrider2021": {
    from: "aleph2019",
    to: "dagrider2021",
    kind: "refine",
    key: "可靠廣播",
    change: "依 DAG-Rider 的描述：Aleph 建的是 round-based DAG，搭配較有效率的二元協議，但每個決定要 $O(n^3)$、沒有攤提，不滿足 Validity，safety 靠簽章。DAG-Rider 用可靠廣播建出有結構的 DAG，攤提通訊最佳，滿足 Validity，而且在給定完美 shared coin 時 safety 不靠簽章。",
    evidence: "DAG-Rider related work（HashGraph 與 Aleph 的段落）與摘要；Aleph §1（first instance of using DAGs … asynchronous BFT）。",
  },
  "avid2005>dagrider2021": {
    from: "avid2005",
    to: "dagrider2021",
    kind: "refine",
    change: "DAG-Rider 把批次處理與 Cachin–Tessaro 的非同步可驗證資訊分散（AVID）協議結合，當成可靠廣播的積木，來達到最佳的攤提通訊；Bullshark 的引言也這樣描述 DAG-Rider。AVID 本身的結果是在大輸入下，讓 reliable broadcast 的通訊量降低一個數量級。",
    evidence: "DAG-Rider §1（efficient asynchronous verifiable information dispersal protocol [14]）；Bullshark §1；AVID 摘要。",
  },
  "dagrider2021>narwhal2022": {
    from: "dagrider2021",
    to: "narwhal2022",
    kind: "refine",
    key: "mempool",
    change: "Tusk 是 DAG-Rider 的可實作版本，safety 論證沿用 DAG-Rider；wave 由 4 輪縮成 3 輪，訊息延遲隨機時，每個區塊約 5.5 輪 commit 降到 4.5 輪（都是 DAG 輪）。Narwhal 另外把資料傳播獨立成 mempool。",
    evidence: "Narwhal §5.1（Tusk modifies DAG-Rider…；4 輪 wave、5.5 輪）與 Lemma 5（4.5 輪）；Bullshark §1（decoupling data dissemination）。",
  },
  "dagrider2021>bullshark2022": {
    from: "dagrider2021",
    to: "bullshark2022",
    kind: "refine",
    key: "同步快路徑",
    change: "保留 DAG-Rider 的非同步最壞情況 liveness（期望 6 輪，與 DAG-Rider 相同）、攤提通訊最佳與 post-quantum safety，另外加上同步期的快路徑：同步期每兩次 commit 之間只需 2 輪，原文說比 DAG-Rider 少 75%。這裡的「輪」是 DAG 輪（原文引言稱 round-trip），與 Cordial Miners 的通訊輪、Shoal++ 的 message delay 不同。",
    evidence: "Bullshark §1（BullShark needs only 2 roundtrips … 75% improvement compared to DAG-Rider；6 round-trip）。",
  },
  "narwhal2022>bullshark2022": {
    from: "narwhal2022",
    to: "bullshark2022",
    kind: "refine",
    change: "Bullshark 建在 Narwhal 上。Tusk 有垃圾回收，但沒有可量化的公平性；Bullshark 在同步期同時做到垃圾回收與公平。",
    evidence: "Bullshark §1（Tusk … garbage collection but does not allow quantifiable fairness；fairness during synchronous periods）。",
  },
  "dagrider2021>cordial2023": {
    from: "dagrider2021",
    to: "cordial2023",
    kind: "respond",
    key: "去掉 RB",
    change: "Cordial Miners 把 DAG-Rider（非同步）與 Bullshark（eventual synchrony）當作 state-of-the-art，指出它們都用 Reliable Broadcast 排除 equivocation，代價是延遲與訊息數。它去掉 RB：用 blocklace 容納 equivocation，在本地排序時才排除。非同步下的期望延遲，原文算 DAG-Rider 是 12 個通訊輪（RB 取最少 2 輪時；用 erasure coding 的 RB 則是 24）、Cordial Miners 是 7.5；good case 由 8 降到 5（同樣的假設下，erasure coding 時為 16）。這裡的「輪」是通訊輪（含 RB 內部的輪），與本站表格的 DAG 輪不同。",
    evidence: "Cordial Miners 摘要、§1 與 Table 1（forgoing Reliable Broadcast；12→7.5、8→5）。",
  },
  "bullshark2022>cordial2023": {
    from: "bullshark2022",
    to: "cordial2023",
    kind: "respond",
    change: "eventual synchrony 一側，Cordial Miners 算 Bullshark 的期望延遲是 9 個通訊輪、good case 4 輪（RB 取最少 2 輪時；erasure coding 時為 18 與 8），自己是 4.5 與 3；原文並稱 Bullshark 是 DAG-Rider 的變體，延遲約為其一半，Cordial Miners 的延遲更低。訊息複雜度：最壞情況同為 $O(n^2)$，實際故障數是 $O(1)$ 且同步時 good case 可到 $O(n)$。",
    evidence: "Cordial Miners §1、Table 1、§8 related work。",
  },
  "bullshark2022>mysticeti2025": {
    from: "bullshark2022",
    to: "mysticeti2025",
    kind: "respond",
    key: "不認證區塊",
    change: "Mysticeti 把 DAG-Rider、Narwhal 與 Tusk、Bullshark 當作使用結構化 DAG 與 commit 規則的靈感，指出它們的 DAG 都要認證區塊（consistent broadcast），多次往返、每個 wave 才有一次 commit 機會、簽章的 CPU 成本高。Mysticeti-C 不認證區塊、每個區塊獨立 commit，聲稱達到 3 個 message round 的下界（原文引 Martin–Alvisi 的 fast BFT）；Sui 部署時從 Bullshark 換成 Mysticeti-C，P50 延遲由 1.9 秒降到 400 毫秒。",
    evidence: "Mysticeti 摘要、§I（Mysticeti-C: the power of uncertified DAGs；lower bound [21] = Martin–Alvisi）、Fig. 1、§related work。",
  },
  "bullshark2022>shoal2024": {
    from: "bullshark2022",
    to: "shoal2024",
    kind: "refine",
    key: "聲譽機制",
    change: "Shoal 是加在 Narwhal 系共識（原文以部分同步版的 Bullshark 實例化）之上的框架：第一次在 DAG-BFT 引入 leader reputation 與 pipelining，並讓幾乎不必用 timeout（原文稱 prevalent responsiveness）。實驗上比原版 Bullshark 無故障時延遲最多少 40%、有故障時最多少 80%。",
    evidence: "Shoal 摘要。",
  },
  "shoal2024>shoalpp2025": {
    from: "shoal2024",
    to: "shoalpp2025",
    kind: "refine",
    key: "多 anchor",
    change: "Shoal++ 說 Bullshark 即使無故障也最多要 4 個 DAG 輪才 commit 一個 proposal（無故障下平均 12 message delay），Shoal 縮到 3 輪（期望 10.5 md）。它把延遲拆成排隊、anchoring、anchor commit 三段分別處理，平均降到 4.5 md（無故障、常見情形），對 Bullshark 最多少 60%、對 Mysticeti（原文稱並行工作）最多少 40%。以上依 arXiv v1，內文可能與 NSDI 版不同。",
    evidence: "Shoal++ 摘要、§1、§3.2。",
  },
  "shoal2024>sailfish2025": {
    from: "shoal2024",
    to: "sailfish2025",
    kind: "respond",
    key: "leader/輪",
    change: "依 Sailfish 的評述：現有 DAG-BFT 大多每 2 輪以上才有一個 leader，Shoal 與 Mysticeti 認為每輪都有 leader vertex 很難（這是 Sailfish 引用兩篇原話後的說法，兩篇都承認過這個困難，之後各自宣稱解決了）。Sailfish 自稱是第一個每輪都有 leader vertex 的：誠實 leader 下，commit leader vertex 要一個 RBC 輪加 $1\\delta$，commit 其他 vertex 只多一個 RBC 輪。",
    evidence: "Sailfish 摘要與 Table 1；Sailfish 引言引了 Shoal 與 Mysticeti 的原話。",
  },
  "mysticeti2025>sailfish2025": {
    from: "mysticeti2025",
    to: "sailfish2025",
    kind: "related",
    change: "本站畫的對應：Sailfish 引用 Mysticeti 與 Shoal 各自談到 Bullshark 的 commit 規則或 pipelining 時承認的困難，並說它們認為每輪都有 leader vertex「很難，幾乎不可能」；後者是 Sailfish 的加強語氣，不是這兩篇的整體立場，兩篇之後都宣稱自己解決了（Mysticeti 用多狀態 slot，Shoal 重新詮釋 DAG）。",
    evidence: "Sailfish 摘要；Mysticeti §II-A 有 Sailfish 引的那句；Shoal §1 有 Sailfish 引的那句。",
  },
  "bullshark2022>autobahn2024": {
    from: "bullshark2022",
    to: "autobahn2024",
    kind: "respond",
    key: "blip 恢復",
    change: "Autobahn 稱 Bullshark 是最流行的部分同步 DAG 協議，仍要多輪 Reliable Broadcast，最多 12 message delay 才 commit。它處理另一個問題：真實的部分同步是一段一段的（blips），傳統的 view-based 協議（例如 HotStuff）在 blip 結束後會有 hangover，Bullshark 這類 DAG 協議則是 blip 後恢復得比較平順，缺點是平時的延遲。Autobahn 的資料傳播層在 blip 期間也持續前進，上面疊傳統風格的部分同步共識；blip 結束後能立刻 commit 整個資料積壓。原文稱它的 throughput 與 Bullshark 相當、延遲少一半以上，延遲與 HotStuff 相當、卻沒有 hangover。",
    evidence: "Autobahn 摘要、§1（Bullshark … 12 message delays；hangovers；seamless）。",
  },
};

export const lineages: Record<string, Lineage> = {
  "gates-and-keys": {
    title: "門與鑰匙：每道下界是怎麼被鬆開的",
    timing: "any",
    status: 'draft',
    concept: "一道下界是一扇門，擋住某件事；鬆開哪個假設（鑰匙）就能通過。圖上每個框內標「鑰匙：…」，表示它是靠這個假設通過前一道門的。",
    keyNote: "＝鑰匙：這一步鬆開了哪個假設",
    caption: "五道門各占一塊：左上是容錯（無簽章要 $3f+1$），右上是輪數（確定性至少 $f+1$ 輪），中間左邊是非同步（確定性不可能），中間右邊是通訊量，最下面一列是好情況的延遲。每一塊內橫向是「站在誰的肩上」，不同塊之間沒有時間先後。實線＝改進，虛線＝回應前一篇留下的限制，細灰線＝本站畫的對應。",
    nodes: [
      { ref: "psl1980", col: 0, row: 0, role: "spine", tag: "無簽章：$n\\ge 3m+1$" },
      { ref: "lsp1982", col: 1, row: 0, role: "spine", tag: "口頭 $3m+1$；簽章不限 $m$" },
      { ref: "flm1986", col: 1, row: 1.1, role: "bridge", tag: "重證 $3m+1$，連通度" },
      { ref: "ds1983", col: 2, row: 0, role: "spine", tag: "簽章，$f+1$ 輪" },
      { ref: "fl1982", col: 3, row: 0, role: "spine", tag: "確定性：至少 $m+1$ 輪" },
      { ref: "rabin1983", col: 4, row: 0, role: "bridge", tag: "隨機化；有 dealer" },
      { ref: "fm1997", col: 5, row: 0, role: "bridge", tag: "期望常數輪，無 dealer" },
      { ref: "flp1985", col: 0, row: 2.4, role: "spine", tag: "非同步確定性：必有不終止" },
      { ref: "benor1983", col: 1, row: 2.4, role: "spine", tag: "local coin，$5f<n$" },
      { ref: "dls1988", col: 1, row: 3.5, role: "spine", tag: "部分同步，$3f+1$" },
      { ref: "dr1985", col: 3, row: 2.4, role: "spine", tag: "通訊量下界" },
      { ref: "momose2021", col: 4, row: 2.4, role: "bridge", tag: "同步簽章下二次通訊" },
      { ref: "goodcase2021", col: 0, row: 4.8, role: "spine", tag: "好情況延遲的緊界" },
      { ref: "simplex2023", col: 1, row: 4.8, role: "outer", tag: "$3\\delta$ 確認時間" },
      { ref: "martin-alvisi", col: 3, row: 4.8, role: "bridge", tag: "fast BFT，未讀原文" },
      { ref: "mysticeti2025", col: 4, row: 4.8, role: "bridge", tag: "3 個 message round" },
      { ref: "raresync2024", col: 4, row: 3.5, role: "bridge", tag: "部分同步 $O(n^2)$" },
    ],
    edges: [
      "psl1980>lsp1982",
      "psl1980>flm1986",
      "lsp1982>ds1983",
      "fl1982>rabin1983",
      "rabin1983>fm1997",
      "flp1985>benor1983",
      "flp1985>dls1988",
      "dr1985>momose2021",
      "goodcase2021>simplex2023",
      "martin-alvisi>mysticeti2025",
      "dr1985>raresync2024",
    ],
    notes: [
      "PSL 的演算法用 $m+1$ 輪，Fischer–Lynch 證明輪數不能再少，所以右上的輪數門其實接在 PSL 之後；Dolev–Strong 又把這個下界推廣到任何類型的訊息（包括簽章），結論仍是至少 $f+1$ 輪。這兩條關係跨在兩塊之間，圖上沒畫。",
      "Dolev–Reischuk 的引言把 Dolev–Strong 當作當時最好的簽章演算法（$t+1$ 階段、$O(nt+t^2)$ 訊息），然後新增「資訊交換量」這個維度：簽章下至少 $\\Omega(nt)$ 個簽章與 $\\Omega(n+t^2)$ 則訊息。",
      "延遲這道門只畫了入口：Good-case Latency 在非同步與部分同步下給出緊界，同步下 $f<n/2$ 的各情形也有緊界，$f\\ge n/2$ 的同步情形上下界仍有差距。本站讀過它的摘要、引言與主要定理的陳述（Theorem 1 到 4），沒讀證明；完整的分類等 `cost/good-case` 頁寫好再補。Mysticeti 引用的 3 個 message round 下界出自 Martin–Alvisi，這篇原文還沒讀。",
      "通訊量這道門的鑰匙還沒有寫：Abraham 等人 PODC 2019（Communication Complexity of Byzantine Agreement, Revisited）的原文還沒到，是否有論文鬆開這道門、鬆開的是哪個假設，要讀原文才能寫，所以這裡不下結論。",
    ],
    cross: [
      { text: "兩把鑰匙之後的演算法（Dolev–Strong 到 Sync HotStuff、Rabin 到 Abraham 等）：", href: "/sync/", hrefLabel: "同步的演算法脈絡" },
      { text: "Ben-Or 之後 coin 如何變便宜（Bracha、CKS、MMR、VABA、HoneyBadger）：", href: "/async/", hrefLabel: "非同步 BA 的 coin 脈絡" },
      { text: "DLS 之後的 leader 式協議（PBFT、HotStuff、RareSync 的完整脈絡）：", href: "/partial-sync/", hrefLabel: "部分同步的換 leader 脈絡" },
    ],
    qa: [
      { q: "誰最先提出？", a: "無簽章的 $3m+1$：PSL；確定性的 $m+1$ 輪：Fischer–Lynch；非同步確定性的不可能：FLP；通訊量的下界：Dolev–Reischuk。FLM 則用覆蓋圖重新證明 $3m+1$，並把連通度 $2m+1$ 正式證出。" },
      { q: "誰鬆開了哪道門？", a: "簽章鬆開容錯（LSP、Dolev–Strong 做到任意數量故障，但輪數的下界仍在）；隨機化鬆開確定性的輪數與非同步的不可能（Rabin、Feldman–Micali；Ben-Or）；部分同步鬆開非同步（DLS）。通訊量這道門，本站還沒讀到鬆開它的論文（Abraham 等人 PODC 2019 待讀）；本站畫的 Momose–Ren 與 RareSync 是在同一個模型下追平這道門，不是鬆開。" },
      { q: "有沒有「鬆開一道門又碰到另一道」的例子？", a: "Dolev–Strong：簽章讓容錯脫離 $3f+1$，但仍卡在 $f+1$ 輪；而且基本版通訊量是三次，Momose–Ren 才把它做到二次。這是本站的讀法，不是原文的話：每把鑰匙只鬆開一道門。" },
      { q: "目前有共識嗎？", a: "Sync HotStuff、Momose–Ren、RareSync 都把前面這些下界當成既定的前提直接引用，可見這幾道門是公認的。至於「還有哪些門」（例如延遲下界），本頁還沒涵蓋，待作者補。" },
    ],
  },
  "sync-two-routes": {
    title: "同步 BA：演算法怎麼逼近下界",
    timing: "sync",
    status: 'draft',
    concept: "同步下確定性協議被兩道下界（容錯與輪數）和一道通訊下界擋著；簽章鬆開了前者，隨機化鬆開了輪數。這棵樹只畫演算法，下界在不可能性與下界一部分。",
    caption: "橫向是「站在誰的肩上」。上面一支是簽章與通訊，下面一支是隨機化。實線＝改進，虛線＝回應前一篇留下的限制，細灰線＝本站畫的對應。下界本身（$3f+1$、$f+1$ 輪、通訊量）不在這裡重畫，見圖下方的連結。",
    nodes: [
      { ref: "ds1983", col: 0, row: 0, role: "spine", tag: "簽章，$f+1$ 輪" },
      { ref: "synchs2020", col: 1, row: 0, role: "bridge", tag: "SMR，$2\\Delta$，$f<n/2$" },
      { ref: "momose2021", col: 1, row: 1.2, role: "bridge", tag: "簽章下二次通訊" },
      { ref: "rabin1983", col: 0, row: 2.4, role: "bridge", tag: "隨機化；有 dealer", href: '/sync/randomized/#rabin' },
      { ref: "fm1997", col: 1, row: 2.4, role: "bridge", tag: "期望常數輪，無 dealer" },
      { ref: "katzkoo2006", col: 2, row: 2.4, role: "bridge", tag: "$t<n/2$，只要簽章與 PKI" },
      { ref: "abraham2019fc", col: 3, row: 2.4, role: "outer", tag: "10／16 輪" },
    ],
    edges: [
      "ds1983>synchs2020",
      "ds1983>momose2021",
      "rabin1983>fm1997",
      "fm1997>katzkoo2006",
      "katzkoo2006>abraham2019fc",
    ],
    notes: [
      "Dolev–Strong 的簽章演算法與 Rabin 的隨機化協議各是一道門的鑰匙：無簽章要 $3f+1$、確定性至少 $f+1$ 輪。這兩道門與通訊量的下界（Dolev–Reischuk）是怎麼被推廣、被追平的，畫在不可能性與下界的「門與鑰匙」，這裡不重畫。",
    ],
    cross: [
      { text: "本棵樹的起點是三道下界（無簽章要 $3f+1$、確定性至少 $f+1$ 輪、通訊至少二次）以及簽章與隨機化這兩把鑰匙：", href: "/impossibility/gates/", hrefLabel: "不可能性與下界的「門與鑰匙」頁" },
      { text: "RareSync 把 Dolev–Reischuk 的二次通訊下界在部分同步下追平；Momose–Ren 是同步簽章下的對應：", href: "/partial-sync/", hrefLabel: "部分同步的換 leader 脈絡" },
      { text: "CKS 說 Canetti–Rabin 的非同步 coin-tossing 建在 Feldman–Micali 對同步模型的工作之上：", href: "/async/", hrefLabel: "非同步 BA 的 coin 脈絡" },
    ],
    qa: [
      { q: "誰最先提出？", a: "簽章一支是 Dolev–Strong 的簽章演算法（$f+1$ 輪）；隨機化一支是 Rabin 先給出期望輪數固定的協議。這兩支各自要突破的下界，最早的出處見「門與鑰匙」。" },
      { q: "誰指出限制？", a: "Momose–Ren 指出 Dolev–Strong 的通訊量是三次；Sync HotStuff 指出現有同步協議輪數多、需要 lock-step；Abraham 等指出 Katz–Koo 要期望 29 輪；Feldman–Micali 與 Katz–Koo 都指出較早的隨機化協議要 trusted dealer。" },
      { q: "誰改進得更完整？", a: "簽章一支：Momose–Ren 把通訊做到二次，Sync HotStuff 做成穩定狀態 $2\\Delta$ 的 SMR；隨機化一支：Feldman–Micali 去掉 Rabin 需要的 dealer，Katz–Koo 推到 $t<n/2$，Abraham 等再把期望輪數從 29 降到 10 或 16（但要依賴 common coin 與門檻簽章）。" },
      { q: "目前有共識嗎？", a: "Sync HotStuff 把 $f+1$ 輪當成確定性協議的下界直接引用，Momose–Ren 把二次通訊當成必要條件，可見這兩個下界是公認的。更晚的期望常數輪協議本站只讀到 Abraham 等為止，不對整個領域下結論，待作者補。" },
    ],
  },
  "leader-change": {
    title: "部分同步：換 leader 的成本",
    timing: "partial",
    status: 'draft',
    concept: "leader 壞掉時怎麼安全地換人、換人要付多少通訊，以及大家怎麼在同一個 view 上同步。",
    caption: "橫向是「站在誰的肩上」。實線＝改進，虛線＝回應前一篇留下的限制，細灰線＝本站畫的對應（後者沒有引用前者）。通訊量的度量不同：HotStuff 數 authenticators，RareSync 數 words，Cogsworth 數 messages，不能直接相減。",
    nodes: [
      { ref: "tendermint2018", col: 1, row: 0, role: "bridge", tag: "單一執行模式" },
      { ref: "dls1988", col: 0, row: 1.4, role: "spine", tag: "定義部分同步，輪流 phase" },
      { ref: "pbft2002", col: 1, row: 2.8, role: "spine", tag: "輪流 primary" },
      { ref: "hotstuff2019", col: 2, row: 1.4, role: "spine", tag: "線性換 leader，三階段" },
      { ref: "jolteon2022", col: 3, row: 0, role: "bridge", tag: "2-chain；Ditto 加 fallback" },
      { ref: "cogsworth2021", col: 3, row: 1.4, role: "bridge", tag: "定義 view synchronization" },
      { ref: "raresync2024", col: 3, row: 2.8, role: "bridge", tag: "$O(n^2)$ view sync" },
      { ref: "simplex2023", col: 4, row: 0, role: "outer", tag: "簡單的 rotating leader" },
    ],
    edges: [
      "dls1988>pbft2002",
      "dls1988>tendermint2018",
      "pbft2002>tendermint2018",
      "pbft2002>hotstuff2019",
      "tendermint2018>hotstuff2019",
      "hotstuff2019>jolteon2022",
      "hotstuff2019>cogsworth2021",
      "hotstuff2019>raresync2024",
      "jolteon2022>simplex2023",
    ],
    notes: [
      "DLS 到 PBFT 那條是本站畫的對應：PBFT 全文沒有引用 DLS，兩者只是同一類模型。Tendermint 自述受 PBFT 與 DLS 啟發，這點是 Tendermint 自己寫的。",
    ],
    cross: [
      { text: "RareSync 的標題主張 Dolev–Reischuk 的二次通訊下界在部分同步下也是緊的；同步下的對應在：", href: "/sync/", hrefLabel: "同步的通訊下界" },
      { text: "Ditto 用 asynchronous fallback 取代 view synchronization，原文拿 VABA 當比較對象：", href: "/async/", hrefLabel: "非同步 BA 的 coin 脈絡" },
      { text: "Simplex 引 Good-case Latency 說「$3\\delta$ 在 $f\\ge (n+2)/5$ 時是最佳的」。這個延遲下界的完整分類會寫在：", href: "/impossibility/cost/good-case/", hrefLabel: "不可能性與下界的 good-case 頁（規劃中）" },
    ],
    qa: [
      { q: "誰最先提出？", a: "DLS 先定義部分同步，並給出輪流指派 phase 的協議；PBFT 自稱是第一個在非同步下仍 safe 的拜占庭 SMR 演算法；HotStuff 自稱（to our knowledge）是第一個同時有線性換 leader 與 responsiveness 的部分同步 BFT 複製協議；Cogsworth 自稱給出第一個拜占庭 view synchronization 的解。" },
      { q: "誰指出限制？", a: "HotStuff 指出 PBFT 與 Zyzzyva 換 leader 是 $O(n^3)$、SBFT 是 $O(n^2)$，以及 Tendermint 與 Casper 為了簡單的輪流 leader 放棄了 responsiveness；Cogsworth 與 RareSync 指出 HotStuff 把 view synchronization 留成黑盒；Simplex 指出 pipelined 協議拿確認時間換區塊時間。" },
      { q: "誰改進得更完整？", a: "沒有單一答案：HotStuff 換到線性換 leader 與 responsiveness；Jolteon 換到較低延遲（代價是換 leader 變 quadratic）；Cogsworth 與 RareSync 各自補 view synchronization，後者讓 Dolev–Reischuk 下界在部分同步下追平。" },
      { q: "目前有共識嗎？", a: "HotStuff 自己寫明兩階段版本會失去 optimistic responsiveness，要靠等最大延遲補救，所以「多一階段換 responsiveness」是取捨，不是白賺。其餘的取捨（2-chain 與 3-chain、線性與低延遲）本站只轉述各論文自己的說法，整個領域的共識待作者補。" },
    ],
  },
  "async-coin": {
    title: "非同步 BA：coin 從哪裡來",
    timing: "async",
    status: 'draft',
    concept: "FLP 擋住確定性協議之後，隨機化的 coin 如何一步步變便宜、變強，又如何長成實用的非同步 SMR。",
    caption: "橫向是「站在誰的肩上」，不是出版年份：Ben-Or 的引言已經把 FLP 當成既有結果，所以 FLP 在最左邊。實線＝改進，虛線＝回應前一篇留下的限制。",
    nodes: [
      { ref: "flp1985", col: 0, row: 1.2, role: "spine", tag: "確定性必有不終止的執行" },
      { ref: "benor1983", col: 1, row: 0, role: "spine", tag: "local coin，$5f<n$" },
      { ref: "rabin1983", col: 1, row: 2.4, role: "spine", tag: "預先分發的 coin" },
      { ref: "bracha1987", col: 2, row: 0, role: "spine", tag: "RBC 與 $f<n/3$ BA" },
      { ref: "cks2000", col: 2, row: 2.4, role: "spine", tag: "門檻簽章 coin" },
      { ref: "mmr2015", col: 3, row: 0, role: "spine", tag: "免簽章，$O(n^2)$" },
      { ref: "cr1993", col: 3, row: 1.2, role: "bridge", tag: "最佳容錯，期望常數時間" },
      { ref: "ckps2001", col: 3, row: 2.4, role: "bridge", tag: "VABA，$O(n^3)$" },
      { ref: "avid2005", col: 3, row: 3.6, role: "bridge", tag: "可驗證分散" },
      { ref: "honeybadger2016", col: 4, row: 1.2, role: "bridge", tag: "實用的非同步 SMR" },
      { ref: "vaba2019", col: 4, row: 2.4, role: "spine", tag: "VABA，$O(n^2)$" },
    ],
    edges: [
      "flp1985>benor1983",
      "flp1985>rabin1983",
      "benor1983>bracha1987",
      "bracha1987>cr1993",
      "rabin1983>cks2000",
      "bracha1987>mmr2015",
      "cks2000>mmr2015",
      "bracha1987>avid2005",
      "cks2000>ckps2001",
      "ckps2001>vaba2019",
      "ckps2001>honeybadger2016",
      "mmr2015>honeybadger2016",
    ],
    notes: [
      "HoneyBadger 的 ACS 歸約出自 Ben-Or–Kelmer–Rabin 1994，本站還沒收入這篇的書目，所以不畫成節點。",
    ],
    cross: [
      { text: "Aleph 自稱改進 HoneyBadgerBFT 的漸近延遲，並（依作者所知）是第一個用 DAG 設計非同步 BFT 的：", href: "/convergence/", hrefLabel: "合流的 DAG 脈絡" },
      { text: "DAG-Rider 自述承接 VABA 與 Dumbo 這條單次共識路線，並指出它們事後忽略一半訊息、從 $O(n)$ 個提案中只 commit 一個，DAG-Rider 則不浪費訊息：", href: "/convergence/dag-rider/", hrefLabel: "DAG-Rider" },
      { text: "CKS 說 Canetti–Rabin 的 coin-tossing 可以從零開始產生 common coin，並且是建在 Feldman–Micali 對同步模型的工作之上：", href: "/sync/", hrefLabel: "同步的隨機化支線" },
      { text: "Jolteon 論文的 Ditto 用 asynchronous fallback 取代 view synchronization，並拿 VABA 當比較對象：", href: "/partial-sync/", hrefLabel: "部分同步的換 leader 脈絡" },
    ],
    qa: [
      { q: "誰最先提出？", a: "Ben-Or 與 Rabin：CKS 的引言說兩者是最早用隨機化繞過 FLP 的協議；VABA 的引言只提到 Ben-Or 用隨機化讓不終止的執行機率為 0。" },
      { q: "誰指出限制？", a: "Bracha 指出 Rabin 的模型較強（要事先分發 coin）；Canetti–Rabin 指出 Bracha 雖然容錯最佳，期望時間卻是指數；CKS 指出預先分發的 coin 會用完；MMR 指出 Bracha 沒有 common coin，可能要指數輪；HoneyBadger 指出 CKPS01 每筆交易要 $O(N^2)$ bits。" },
      { q: "誰改進得更完整？", a: "各補一塊：Canetti–Rabin 做到容錯最佳又期望常數時間（靠 AVSS，不需要 dealer）；CKS 給出實用的 coin；MMR 在給定 coin 時免簽章並達到 $O(n^2)$ 訊息；VABA 把 multi-valued 的通訊降到 $O(n^2)$；HoneyBadger 把這些元件組成實用的非同步 SMR。" },
      { q: "目前有共識嗎？", a: "CKS 寫道，coin-tossing 幾乎出現在所有非同步 BA 的解法裡。至於整個領域對「哪條路線最好」有沒有共識，是判斷而不是可核對的事實，本頁不下結論，待作者補。" },
    ],
  },
  "dag-commit": {
    title: "DAG-BFT：commit 規則從哪來、怎麼變快",
    timing: "hybrid",
    status: 'draft',
    concept: "把資料傳播與排序拆開之後，DAG 上的 commit 規則一路要解決的問題。",
    caption: "橫向是「站在誰的肩上」。實線＝改進，虛線＝回應前一篇留下的限制。各論文的延遲數字用的度量不同（DAG 輪、通訊輪、message delay），下面逐條列出時都標了單位，彼此不能直接比。",
    nodes: [
      { ref: "avid2005", col: 0, row: 2.7, role: "bridge", tag: "可驗證分散" },
      { ref: "aleph2019", col: 0, row: 1.3, role: "bridge", tag: "早期的 DAG 協議" },
      { ref: "dagrider2021", col: 1, row: 1.3, role: "spine", tag: "本地排序" },
      { ref: "narwhal2022", col: 2, row: 0, role: "spine", tag: "mempool 與 Tusk" },
      { ref: "bullshark2022", col: 3, row: 1.3, role: "spine", tag: "同步快路徑" },
      { ref: "cordial2023", col: 4, row: 0, role: "bridge", tag: "去掉 RB，blocklace" },
      { ref: "mysticeti2025", col: 4, row: 1.1, role: "bridge", tag: "不認證區塊" },
      { ref: "shoal2024", col: 4, row: 2.2, role: "outer", tag: "leader reputation" },
      { ref: "autobahn2024", col: 4, row: 3.3, role: "bridge", tag: "seamless，部分同步" },
      { ref: "sailfish2025", col: 5, row: 0.9, role: "bridge", tag: "每輪都有 leader" },
      { ref: "shoalpp2025", col: 5, row: 2.3, role: "outer", tag: "平均 4.5 md" },
    ],
    edges: [
      "aleph2019>dagrider2021",
      "avid2005>dagrider2021",
      "dagrider2021>narwhal2022",
      "dagrider2021>bullshark2022",
      "narwhal2022>bullshark2022",
      "dagrider2021>cordial2023",
      "bullshark2022>cordial2023",
      "bullshark2022>mysticeti2025",
      "bullshark2022>shoal2024",
      "shoal2024>shoalpp2025",
      "shoal2024>sailfish2025",
      "mysticeti2025>sailfish2025",
      "bullshark2022>autobahn2024",
    ],
    notes: [
      "Cordial Miners 與 Mysticeti 是並列的兩條路，不是前後代。Mysticeti 自己說兩者的 DAG 結構相似，但 Cordial Miners 每個 wave 只 commit 一個區塊、期望延遲較高，也沒有實作可比較；它還說 Cordial Miners 的稿件是在 Mysticeti 進行期間公開的。",
    ],
    cross: [
      { text: "上游：Aleph 自稱改進 HoneyBadgerBFT 的漸近延遲，HoneyBadger 在：", href: "/async/", hrefLabel: "非同步 BA 的 coin 脈絡" },
      { text: "DAG-Rider 自述承接 VABA 與 Dumbo，並指出它們事後忽略一半訊息；VABA 也在：", href: "/async/", hrefLabel: "非同步 BA 的 coin 脈絡" },
      { text: "Mysticeti 的「3 個 message round」下界出自 Martin–Alvisi 的 fast BFT；延遲下界的完整分類（Good-case Latency）會寫在：", href: "/impossibility/cost/good-case/", hrefLabel: "不可能性與下界的 good-case 頁（規劃中）" },
    ],
    qa: [
      { q: "誰最先提出？", a: "依 Aleph 自己的說法，它（依作者所知）是第一個用 DAG 設計非同步 BFT 的，並且改進 HoneyBadgerBFT 的漸近延遲；DAG-Rider 自稱是第一個同時達到最佳 resilience、最佳輪數與最佳攤提通訊的非同步 BAB。" },
      { q: "誰指出限制？", a: "DAG-Rider 指出 Aleph 的複雜度與 Validity 的缺口；Bullshark 指出 DAG 協議都為非同步最壞情況優化、沒利用同步期；Cordial Miners 與 Mysticeti 都指出 Reliable Broadcast 或區塊認證的延遲代價；Sailfish 指出多數 DAG-BFT 每 2 輪以上才有一個 leader；Autobahn 指出 Bullshark 類 DAG 協議平時延遲偏高（最多 12 message delay），以及傳統協議（如 HotStuff）在 blip 後的 hangover，兩個缺點分屬不同的協議。" },
      { q: "誰改進得更完整？", a: "沒有單一贏家，各解決一個限制：Tusk 讓 DAG-Rider 可實作並縮短 wave；Bullshark 補上同步期快路徑、垃圾回收與公平；Cordial Miners 與 Mysticeti 分別去掉 RB 與區塊認證；Shoal 與 Shoal++ 在 Bullshark 上加 leader reputation、pipelining 與多 anchor；Sailfish 做到每輪有 leader；Autobahn 處理 blip。" },
      { q: "目前有共識嗎？", a: "各論文用的延遲度量不同（DAG 輪、通訊輪、message delay），所以「誰最快」不能直接比，本頁不下結論；Shoal++ 與 Mysticeti 對彼此的比較（40%）也只是 Shoal++ 一方的實驗。整個領域的共識待作者補。" },
    ],
  },
};
