/**
 * 全站術語表：統一譯名與定義的唯一來源。
 *
 * 規則：
 * - term 是「本站頁面實際使用的詞」。很多詞本站直接保留英文（quorum、safety、liveness），
 *   就把 term 寫成英文，不要硬翻。
 * - 譯名由作者拍板。想改譯名，只改這裡，全站同步。
 * - 頁面用詞（term）保持業界習慣的英文或縮寫；作者的中文譯名放在 zh，顯示時加 *，表示只是參考。
 * - def 要短而精確（一到兩句），是要放進懸浮提示的。更長的說明放在 where 指向的頁面。
 * - 定義的依據要和站上頁面一致；來自原文的，在 note 寫明（不顯示在頁面）。
 * - 不確定的別寫。寧可不收這個詞。
 * - id 用小寫英文與連字號，之後不要改（頁面用它引用）。
 */
export type Category = 'model' | 'fault' | 'problem' | 'crypto' | 'protocol' | 'proof' | 'cost';

export const categoryLabel: Record<Category, string> = {
  model: '模型與時序',
  fault: '故障與對手',
  problem: '問題與性質',
  crypto: '密碼學假設與確定性',
  protocol: '協議概念',
  proof: '證明技巧',
  cost: '複雜度',
};

export const categoryLabelEn: Record<Category, string> = {
  model: 'Models and Timing',
  fault: 'Faults and Adversaries',
  problem: 'Problems and Properties',
  crypto: 'Cryptography and Determinism',
  protocol: 'Protocol Concepts',
  proof: 'Proof Techniques',
  cost: 'Complexity',
};

export interface Term {
  /** 本站頁面使用的詞 */
  term: string;
  /** 英文全名，每個單字開頭大寫（介系詞、連接詞除外）；不含縮寫，縮寫放 abbr */
  en: string;
  /** 縮寫（若有）。term 本身已是縮寫時不填，避免同一個縮寫重複出現 */
  abbr?: string;
  /**
   * 中文譯名（參考）。有這個欄位就代表「業界通常直接說英文或縮寫，沒有固定的繁體中文用法」，
   * 顯示時一律加 *。已經有固定中文用法的詞（如 拜占庭容錯），term 本身就是中文，不填 zh。
   */
  zh?: string;
  category: Category;
  /** 短定義（一到兩句），會顯示在懸浮提示 */
  def: string;
  /** 英文定義（英文頁使用） */
  defEn: string;
  /** 英文頁內文使用的詞；term 是中文時必填（term 本身是英文時省略） */
  termEn?: string;
  /** 相關術語的 id */
  see?: string[];
  /** 主要說明的頁面路徑 */
  where?: string;
  /** 給維護者看的備註，不會顯示在頁面 */
  note?: string;
}

/** 術語表與懸浮提示顯示英文詞時，每個單字開頭大寫；行內文字（<Term> 的連結文字）不經過這個函式，維持句中小寫。 */
export const capTerm = (s: string) => s.replace(/(^|[\s(\/-])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());

export const glossary: Record<string, Term> = {
  // ---------------- 模型與時序 ----------------
  sync: {
    term: '同步',
    termEn: 'synchronous',
    en: 'Synchronous',
    category: 'model',
    def: '存在已知的 Δ，誠實節點之間的訊息延遲都不超過 Δ（常搭配有上限的時鐘誤差，或把執行切成同步回合）。timeout 是可靠的故障偵測。',
    defEn: 'There is a known bound Δ, and every message between honest nodes is delivered within Δ (often together with a bounded clock error, or with the execution divided into synchronous rounds). Timeouts are a reliable failure detector.',
    see: ['psync', 'async'],
    where: '/intro/models/',
  },
  psync: {
    term: '部分同步',
    termEn: 'partial synchrony',
    en: 'Partial Synchrony',
    category: 'model',
    def: 'DLS 提出的中間模型：存在一個節點不知道的時間點 GST，GST 之後訊息延遲有界。safety 不能依賴時間假設，liveness 依賴 GST 之後的行為。',
    defEn: 'The intermediate model introduced by DLS: there is a time GST, unknown to the nodes, after which message delays are bounded. Safety must not depend on timing assumptions; liveness depends on behavior after GST.',
    see: ['gst', 'sync', 'async'],
    where: '/intro/models/',
    note: 'DLS 另有「Δ 未知但一直成立」的版本。',
  },
  async: {
    term: '非同步',
    termEn: 'asynchronous',
    en: 'Asynchronous',
    category: 'model',
    def: '訊息延遲有限但沒有任何上界，送達順序由對手決定；唯一保證是誠實節點之間的訊息最終送達。timeout 沒有意義。',
    defEn: 'Message delays are finite but have no bound at all, and the adversary controls delivery order; the only guarantee is that messages between honest nodes are eventually delivered. Timeouts are meaningless.',
    see: ['sync', 'psync'],
    where: '/intro/models/',
  },
  gst: {
    term: 'GST',
    en: 'Global Stabilization Time',
    zh: '全域穩定時間',
    category: 'model',
    def: '部分同步模型中，由對手選定、節點不知道的時間點；GST 之後訊息延遲有界。',
    defEn: 'In the partial-synchrony model, a point in time chosen by the adversary and unknown to the nodes; after GST, message delays are bounded.',
    see: ['psync'],
    where: '/intro/models/',
    note: 'DLS 原文的 GST 模型允許訊息在 GST 前遺失；許多現代論文改成「最終送達」。',
  },
  responsiveness: {
    term: 'responsiveness',
    en: 'Responsiveness',
    zh: '響應性',
    category: 'model',
    def: '協議的進度速度取決於實際的網路延遲 δ，而不是保守的上界 Δ。',
    defEn: 'A protocol\'s progress speed depends on the actual network delay δ, not on the conservative bound Δ.',
    see: ['gst'],
    where: '/intro/models/',
  },

  // ---------------- 故障與對手 ----------------
  byzantine: {
    term: '拜占庭節點',
    termEn: 'Byzantine node',
    en: 'Byzantine Node',
    category: 'fault',
    def: '可以任意偏離協議的節點，包含彼此合謀，以及對不同節點發送矛盾訊息（equivocation）。',
    defEn: 'A node that may deviate arbitrarily from the protocol, including colluding with other faulty nodes and sending contradictory messages to different nodes (equivocation).',
    see: ['honest', 'equivocation', 'crash'],
    where: '/intro/byzantine/',
  },
  honest: {
    term: '誠實節點',
    termEn: 'honest node',
    en: 'Honest (Correct) Node',
    category: 'fault',
    def: '嚴格遵守協議的節點。被網路延遲的誠實節點仍是誠實節點，不計入故障預算 f。',
    defEn: 'A node that follows the protocol exactly. An honest node delayed by the network is still honest and does not count against the fault budget f.',
    see: ['byzantine'],
    where: '/intro/byzantine/',
  },
  crash: {
    term: 'crash fault',
    en: 'Crash Fault',
    zh: '當機故障',
    category: 'fault',
    def: '節點停止後不再發送任何訊息的故障，不會有偽造或矛盾的行為。',
    defEn: 'A fault in which a node stops and sends nothing further; it never forges or contradicts.',
    see: ['byzantine'],
    where: '/intro/byzantine/',
    note: '作者決定全站統一用「故障」（fault），所以 crash fault 譯為當機故障；fault tolerance 仍譯為容錯。',
  },
  equivocation: {
    term: 'equivocation',
    en: 'Equivocation',
    zh: '雙重投票',
    category: 'fault',
    def: '拜占庭節點對不同節點發送互相矛盾的訊息。簽章讓這種行為可以被第三方證明。',
    defEn: 'A Byzantine node sending mutually contradictory messages to different nodes. Signatures let third parties prove this behavior.',
    see: ['byzantine', 'signature'],
    where: '/intro/byzantine/',
    note: '作者不選「矛盾投票」，因為概念上「雙面」強於「矛盾」',
  },
  adaptive: {
    term: '適應性對手',
    termEn: 'adaptive adversary',
    en: 'Adaptive Adversary',
    category: 'fault',
    def: '可以在執行過程中根據觀察到的資訊腐化節點（總數不超過 f）的對手；相對於執行前就固定故障集合的靜態對手。',
    defEn: 'An adversary that may corrupt nodes during the execution based on what it observes (at most f in total), as opposed to a static adversary that fixes the faulty set before the execution.',
    see: ['byzantine'],
    where: '/intro/byzantine/',
  },
  resilience: {
    term: '容錯上界',
    termEn: 'resilience',
    en: 'Resilience',
    category: 'fault',
    def: '協議最多能容忍多少個故障，通常寫成節點數 n 與故障數 f 的關係，例如 n ≥ 3f+1。',
    defEn: 'How many faults a protocol can tolerate, usually written as a relation between the number of nodes n and faults f, for example n ≥ 3f+1.',
    see: ['quorum'],
    where: '/impossibility/overview/',
  },

  cft: {
    term: 'CFT',
    en: 'Crash Fault Tolerance',
    zh: '當機容錯',
    category: 'fault',
    def: '只要故障的節點是 crash 型（停止後不再發送任何訊息），系統仍能正確運作的容錯。所需節點數比 BFT 少：部分同步下 n ≥ 2f+1，BFT 則是 n ≥ 3f+1。',
    defEn: 'Fault tolerance when the faulty nodes are only crash faults (they stop and send nothing further). It needs fewer nodes than BFT: n ≥ 2f+1 under partial synchrony, versus n ≥ 3f+1 for BFT.',
    see: ['crash', 'bft'],
    note: '節點數依 DLS Table I：部分同步下 fail-stop 為 2t+1，拜占庭為 3t+1。',
  },
  bft: {
    term: '拜占庭容錯',
    termEn: 'Byzantine fault tolerance',
    en: 'Byzantine Fault Tolerance',
    abbr: 'BFT',
    category: 'fault',
    def: '系統在最多 f 個節點出現拜占庭故障（可任意偏離協議）時，仍能正確運作的容錯。',
    defEn: 'The system keeps working correctly when up to f nodes suffer Byzantine faults (arbitrary deviation from the protocol).',
    note: '這個詞在中文有固定說法，所以 term 用中文、不填 zh（不加星號）。',
    see: ['byzantine', 'cft'],
    where: '/intro/byzantine/',
  },

  // ---------------- 問題與性質 ----------------
  safety: {
    term: 'safety',
    en: 'Safety',
    zh: '安全',
    category: 'problem',
    def: '壞事永遠不會發生，例如兩個誠實節點決定不同的值。違反 safety 的執行，在有限的前綴就能看到。',
    defEn: 'Nothing bad ever happens, for example two honest nodes deciding different values. A violation of safety is visible in some finite prefix of the execution.',
    see: ['liveness'],
    where: '/intro/problem/',
  },
  liveness: {
    term: 'liveness',
    en: 'Liveness',
    zh: '活性',
    category: 'problem',
    def: '好事最終會發生，例如每個誠實節點最終都會做出決定。必須看無限的執行才能判定。',
    defEn: 'Something good eventually happens, for example every honest node eventually decides. It can only be judged by looking at infinite executions.',
    see: ['safety'],
    where: '/intro/problem/',
  },
  consensus: {
    term: '共識',
    termEn: 'consensus',
    en: 'Consensus',
    category: 'problem',
    def: '一群節點要共同決定同一件事，並且所有誠實節點的決定必須一致。「共識」是泛稱，文獻裡常指 BB、BA 或 SMR 其中一個；本站泛指時說共識，精確時寫出問題的名稱。',
    defEn: 'A group of nodes must jointly decide on the same thing, and the decisions of all honest nodes must agree. “Consensus” is a generic term; in the literature it often means one of BB, BA or SMR. This site says consensus when speaking generally, and names the exact problem when precision matters.',
    see: ['ba', 'bb', 'smr'],
    where: '/intro/byzantine/',
    note: '作者要求（2026-11-12）：about 頁「知道共識基本概念」處給不熟的讀者一個懸浮說明。「共識」是泛稱，精確時本站寫 BB、BA 或 SMR（見 problem 頁）。term 用中文、不填 zh，因為這個詞有固定的中文說法。',
  },
  bb: {
    term: 'Byzantine Broadcast',
    en: 'Byzantine Broadcast',
    abbr: 'BB',
    zh: '拜占庭廣播',
    category: 'problem',
    def: '指定一個發送者廣播一個值。要求 Agreement（誠實節點輸出相同的值）、Validity（發送者誠實時，輸出就是它的值）與 Termination。',
    defEn: 'A designated sender broadcasts a value. Requires Agreement (honest nodes output the same value), Validity (if the sender is honest, the output is its value) and Termination.',
    see: ['ba'],
    where: '/intro/problem/',
  },
  ba: {
    term: 'Byzantine Agreement',
    en: 'Byzantine Agreement',
    abbr: 'BA',
    zh: '拜占庭同意',
    category: 'problem',
    def: '每個節點各有一個輸入，要求誠實節點決定同一個值（Agreement）、最終都做出決定（Termination），並滿足某種 Validity。與 BB、SMR 的關係見常見問題。',
    defEn: 'Each node has an input. Honest nodes must decide the same value (Agreement), all eventually decide (Termination), and some form of Validity holds. Its relation to BB and SMR is explained in the problems page.',
    see: ['bb', 'validity'],
    where: '/intro/problem/',
  },
  smr: {
    term: '狀態機複製',
    termEn: 'state machine replication',
    en: 'State Machine Replication',
    abbr: 'SMR',
    category: 'problem',
    def: '節點持續接收交易並各自輸出一個日誌。要求任兩個誠實節點的日誌互為前綴（safety），且送給誠實節點的交易最終會被寫入（liveness）。也稱 atomic broadcast。',
    defEn: 'Nodes keep receiving transactions and each outputs a log. Any two honest nodes\' logs must be prefixes of one another (safety), and every transaction sent to an honest node is eventually written (liveness). Also called atomic broadcast.',
    see: ['ba'],
    where: '/intro/problem/',
  },
  agreement: {
    term: 'Agreement',
    en: 'Agreement',
    category: 'problem',
    def: '所有誠實節點輸出同一個值。它是 safety 性質：一旦有兩個誠實節點輸出不同的值，壞事在有限時間內就已經發生，無法挽回。',
    defEn: 'All honest nodes output the same value. It is a safety property: once two honest nodes output different values, the bad thing has already happened in finite time and cannot be undone.',
    see: ['safety', 'validity', 'ba'],
    where: '/intro/problem/',
  },
  connectivity: {
    term: '連通度',
    termEn: 'connectivity',
    en: 'Connectivity',
    category: 'model',
    def: '通訊圖的連通度 c(G) 是至少要拿掉幾個節點，才能把圖切成互不相連的兩部分；它衡量節點之間有多少條互不相交的路。',
    defEn: 'The connectivity c(G) of a communication graph is the smallest number of nodes whose removal disconnects the graph; it measures how many node-disjoint paths exist between nodes.',
    see: ['covering'],
    where: '/impossibility/sync/flm/',
  },
  bab: {
    term: 'Byzantine Atomic Broadcast',
    en: 'Byzantine Atomic Broadcast',
    abbr: 'BAB',
    category: 'problem',
    def: '持續進行的廣播問題：除了可靠廣播的三條性質，還要求所有誠實節點以一致的順序交付訊息（total order）。DAG-Rider 系列要求誠實節點的每則訊息最終都被排進順序。作用和 SMR 的日誌相同。',
    defEn: 'A long-lived broadcast problem: besides the three properties of reliable broadcast, all honest nodes must deliver messages in a consistent order (total order). The DAG-Rider line also requires every message of an honest node to be eventually ordered. It plays the same role as the log of SMR.',
    see: ['smr', 'rbc'],
    where: '/convergence/dag-rider/',
    note: 'DAG-Rider §3 Definition 3.1：reliable broadcast（agreement、integrity、validity）加 total order；§1 稱 BAB 在 total order 與 progress 之外保證所有正確 process 的提議最終被納入。',
  },
  dag: {
    term: 'DAG',
    en: 'Directed Acyclic Graph',
    category: 'protocol',
    def: '有向無環圖。DAG-BFT 把每則可靠廣播的訊息當成一個頂點，訊息中對先前訊息的引用就是邊；每個節點在本地各自維護一份，可靠廣播保證各份最終收斂成同一份。',
    defEn: 'A directed acyclic graph. DAG-BFT treats each reliably broadcast message as a vertex, and the references in a message to earlier messages as edges; each node keeps its own local copy, and reliable broadcast makes the copies eventually converge.',
    see: ['rbc', 'wave'],
    where: '/convergence/dag-rider/',
  },
  wave: {
    term: 'wave',
    en: 'Wave',
    category: 'protocol',
    def: 'DAG 協議解讀 DAG 的單位：連續幾輪組成一個 wave，在其中選出 leader 並判斷能否 commit。DAG-Rider 與 Bullshark 的 wave 是 4 輪，Tusk 是 3 輪。',
    defEn: 'The unit in which a DAG protocol interprets the DAG: a few consecutive rounds form a wave, in which a leader is chosen and tested for commitment. A wave has 4 rounds in DAG-Rider and Bullshark, and 3 in Tusk.',
    see: ['leader', 'dag'],
    where: '/convergence/dag-rider/',
  },
  'common-core': {
    term: 'common core',
    en: 'Common Core',
    category: 'proof',
    def: '非同步拜占庭網路上的一個抽象：每個誠實節點最後都拿到一組值，其中有至少 2f+1 個值被所有誠實節點共同擁有。原文的演算法需要三輪通訊。',
    defEn: 'An abstraction for asynchronous Byzantine networks: every honest node ends with a set of values, and at least 2f+1 of them are shared by all honest nodes. The algorithm in the source takes three rounds of communication.',
    see: ['quorum'],
    where: '/convergence/dag-rider/',
    note: 'DAG-Rider §5：common-core 抽象最早出自 Canetti 1996（[15]），拜占庭版由 Dolev–Gafni 2016（[20]）改寫並證明；三輪通訊。',
  },
  'availability-cert': {
    term: 'certificate of availability',
    en: 'Certificate of Availability',
    category: 'protocol',
    def: '一個區塊收集到 2f+1 個節點的簽名確認後形成的憑證。這些簽名中至少有 f+1 個來自誠實節點，它們都已儲存這個區塊，所以區塊日後取得得到。Narwhal 用它當 DAG 的邊。',
    defEn: 'The certificate formed when a block collects signed acknowledgments from 2f+1 nodes. At least f+1 of the signers are honest and have stored the block, so it can be retrieved later. Narwhal uses it as the edges of its DAG.',
    see: ['quorum', 'qc'],
    where: '/convergence/narwhal-tusk/',
    note: 'Narwhal §3.1：A certificate of availability includes 2f+1 signatures, ie. at least f+1 honest validators have checked and stored the block。',
  },
  'random-oracle': {
    term: 'random oracle model',
    en: 'Random Oracle Model',
    category: 'crypto',
    def: '分析密碼學協議時，把雜湊函數當成一個黑盒子裡的隨機函數的理想化模型。它是啟發式的，不是標準模型，但能讓實用的協議得到嚴格的安全證明。CKS 是第一個把它用在拜占庭協議的工作。',
    defEn: 'An idealized model for analyzing cryptographic protocols in which a hash function is treated as a black-box random function. It is heuristic rather than a standard-model assumption, but it lets practical protocols have rigorous security proofs. CKS was the first work to apply it to Byzantine agreement.',
    see: ['common-coin', 'threshold-sig'],
    where: '/async/common-coin/',
    note: 'CKS TR §1.1：as far as we know, our work is the first of its kind to apply the random oracle model to the Byzantine agreement problem；also it is a heuristic device。',
  },
  validity: {
    term: 'validity',
    en: 'Validity',
    zh: '有效性',
    category: 'problem',
    def: '決定的值必須和輸入有關。常見版本有 Strong、Weak、Correct-input 與 External validity，強弱不同，會改變可解性的邊界，談容錯上界時必須指明是哪一種；各論文對 Strong 與 Weak 的稱呼並不一致。',
    defEn: 'The decided value must be related to the inputs. Common versions are Strong, Weak, Correct-input and External validity; they differ in strength and change the boundary of solvability, so any resilience bound must say which one is meant. Papers do not agree on the names Strong and Weak.',
    see: ['ba'],
    where: '/intro/problem/',
  },
  rbc: {
    term: '可靠廣播',
    termEn: 'reliable broadcast',
    en: 'Reliable Broadcast',
    abbr: 'RBC',
    category: 'problem',
    def: '廣播原語，要求：發送者誠實時所有誠實節點交付它的值；任兩個誠實節點不交付不同的值；只要有一個誠實節點交付，所有誠實節點最終都會交付（totality）。',
    defEn: 'A broadcast primitive: if the sender is honest, all honest nodes deliver its value; no two honest nodes deliver different values; if one honest node delivers, all honest nodes eventually deliver (totality).',
    see: ['bb'],
    where: '/async/',
    note: '已對照 Bracha 1987 §1：發送者誠實時所有誠實節點接受它的值；發送者故障時，誠實節點要嘛都接受同一個值、要嘛都不接受。本條的三點是這兩點的展開。Bracha 原文用 accept，本站寫交付。',
  },

  // ---------------- 密碼學假設與確定性 ----------------
  'auth-channel': {
    term: '認證通道',
    termEn: 'authenticated channels',
    en: 'Authenticated Channels',
    category: 'crypto',
    def: '接收者知道訊息來自哪個直接發送者，但無法向第三者證明。與簽章不同。',
    defEn: 'The receiver knows which direct sender a message came from, but cannot prove it to a third party. Different from signatures.',
    see: ['signature'],
    where: '/intro/crypto/',
  },
  signature: {
    term: '簽章',
    termEn: 'digital signature',
    en: 'Digital Signature',
    category: 'crypto',
    def: '可以轉述的認證：A 可以向 C 出示 B 簽過的訊息，當作 B 說過這句話的證據。',
    defEn: 'Transferable authentication: A can show C a message signed by B as evidence that B said it.',
    see: ['auth-channel', 'threshold-sig'],
    where: '/intro/crypto/',
  },
  'threshold-sig': {
    term: '門檻簽章',
    termEn: 'threshold signature',
    en: 'Threshold Signature',
    category: 'crypto',
    def: '需要至少 k 個持有者各自貢獻簽章份額，才能合成一個有效簽章。常用來把一整個 quorum 的支持壓縮成一個簽章。',
    defEn: 'At least k holders must each contribute a signature share to form a valid signature. Often used to compress a whole quorum\'s support into one signature.',
    see: ['qc', 'signature'],
    where: '/intro/crypto/',
  },
  'common-coin': {
    term: 'common coin',
    en: 'Common Coin',
    zh: '共有幣',
    category: 'crypto',
    def: '所有節點看到同一個隨機值，而且在被揭露前對手無法預測的共同隨機源。非同步隨機化協議常用它達到期望常數時間。',
    defEn: 'A shared random source: all nodes see the same random value, and the adversary cannot predict it before it is revealed. Asynchronous randomized protocols often use it to reach expected constant time.',
    see: ['local-coin', 'trusted-dealer'],
    where: '/impossibility/overview/',
    note: 'CKS 引言的描述：a random source observable by all participants but unpredictable for an adversary。；作者參考 common goods（共有財）而譯',
  },
  'local-coin': {
    term: 'local coin',
    en: 'Local Coin',
    zh: '本地幣',
    category: 'crypto',
    def: '每個節點各自獨立擲的硬幣，節點之間看到的結果可能不同。Ben-Or 型協議用它；高容錯下期望時間可能是指數。',
    defEn: 'A coin each node flips independently, so different nodes may see different results. Used by Ben-Or-style protocols; with high fault tolerance the expected time can be exponential.',
    see: ['common-coin'],
    where: '/impossibility/overview/',
  },
  'trusted-dealer': {
    term: 'trusted dealer',
    en: 'Trusted Dealer',
    zh: '可信第三方',
    category: 'crypto',
    def: '只在 setup 階段使用的可信第三方，負責分發金鑰或其他設定，之後協議不再需要它。',
    defEn: 'A trusted party used only during setup to distribute keys or other parameters; the protocol no longer needs it afterwards.',
    see: ['dkg', 'common-coin'],
    where: '/impossibility/overview/',
    note: 'CKS：uses a trusted dealer only in a setup phase。',
  },
  dkg: {
    term: '分散式金鑰生成',
    termEn: 'distributed key generation',
    en: 'Distributed Key Generation',
    abbr: 'DKG',
    category: 'crypto',
    def: '讓一組節點在沒有可信第三方的情況下，共同產生並各自持有金鑰的份額。常用來取代 trusted dealer，為 common coin 或門檻簽章做 setup。',
    defEn: 'Lets a group of nodes jointly generate keys and each hold a share without any trusted party. Often used instead of a trusted dealer to set up a common coin or threshold signatures.',
    note: '依據：DAG-Rider 說明 common coin 的 setup 通常用 trusted dealer，可改用非同步 DKG 協議取代（Kokoris-Kogias–Malkhi–Spiegelman, CCS 2020，DAG-Rider 的參考文獻 [30]；該篇本站沒有收錄）。',
    see: ['trusted-dealer', 'threshold-sig'],
    where: '/async/',
  },

  // ---------------- 協議概念 ----------------
  quorum: {
    term: 'quorum',
    en: 'Quorum',
    zh: '法定人數',
    category: 'protocol',
    def: '協議要求「收到這麼多節點的回應」才進入下一步時，那一組節點的子集，大小記為 q。兩個 quorum 的交集是否含誠實節點，決定了 safety。',
    defEn: 'When a protocol requires “responses from this many nodes” before moving on, the subset of nodes that responded; its size is written q. Whether two quorums intersect in an honest node determines safety.',
    see: ['qc', 'resilience'],
    where: '/impossibility/quorum/',
  },
  qc: {
    term: 'quorum certificate',
    en: 'Quorum Certificate',
    abbr: 'QC',
    zh: '法定人數憑證',
    category: 'protocol',
    def: '由一個 quorum 的簽章（或簽章份額的聚合）構成的證明，表示這個 quorum 的節點都支持某個值。',
    defEn: 'A proof made of the signatures (or aggregated signature shares) of a quorum, showing that the nodes of that quorum support some value.',
    see: ['quorum', 'threshold-sig'],
    where: '/impossibility/quorum/',
  },
  leader: {
    term: 'leader',
    en: 'Leader',
    zh: '領袖',
    category: 'protocol',
    def: 'leader 式協議中，在一個 view 裡負責提議的節點。PBFT 稱 primary。',
    defEn: 'In leader-based protocols, the node responsible for proposing within a view. PBFT calls it the primary.',
    see: ['view', 'view-change'],
    where: '/partial-sync/',
  },
  view: {
    term: 'view',
    en: 'View',
    zh: '任期',
    category: 'protocol',
    def: 'leader 式協議的一個「任期」，每個 view 有一位指定的 leader。',
    defEn: 'One “term” of a leader-based protocol; each view has a designated leader.',
    see: ['leader', 'view-change'],
    where: '/partial-sync/',
  },
  'view-change': {
    term: 'view change',
    en: 'View Change',
    zh: '任期變換',
    category: 'protocol',
    def: '目前的 leader 被懷疑故障時，換到下一個 view（下一位 leader）的子協議。',
    defEn: 'The sub-protocol that moves to the next view (the next leader) when the current leader is suspected of being faulty.',
    see: ['view', 'pacemaker'],
    where: '/partial-sync/',
  },
  pacemaker: {
    term: 'pacemaker',
    en: 'Pacemaker',
    zh: '節律器',
    category: 'protocol',
    def: '保證 GST 之後能取得進展的機制，有兩個成分：synchronization（讓所有誠實節點與一個唯一的 leader 在同一個 view 停留夠久）與選出 leader（常用輪流制）。HotStuff 把它與 safety 機制清楚分開，只給出示意的實作。',
    defEn: 'The mechanism that guarantees progress after GST. It has two ingredients: synchronization (bringing all honest nodes and one unique leader into the same view for long enough) and choosing the leader (often by rotation). HotStuff separates it cleanly from the safety mechanisms and gives only a sketch of an implementation.',
    see: ['view-change'],
    where: '/partial-sync/',
    note: '作者的理由：對應 heartbeat，兩者都與心臟相關。2026-11-12 已對照 HotStuff §6 對 Pacemaker 的描述；Cogsworth、RareSync 屬於前沿（view synchronization 的後續研究），不放在入門定義裡。',
  },

  // ---------------- 證明技巧 ----------------
  bivalent: {
    term: 'bivalent / univalent',
    en: 'Bivalent / Univalent',
    zh: '雙值/單值',
    category: 'proof',
    def: 'FLP 的核心概念。從配置 C 可達的配置中，兩個決定值都可能出現稱為 bivalent；只可能出現一個稱為 univalent。',
    defEn: 'A core concept of FLP. A configuration C from which both decision values are reachable is bivalent; one from which only one value is reachable is univalent.',
    see: ['covering'],
    where: '/impossibility/async/flp/',
    note: 'FLP 原文：C is bivalent if |V| = 2, univalent if |V| = 1。',
  },
  covering: {
    term: 'covering argument',
    en: 'Covering Argument',
    zh: '覆蓋圖論證',
    category: 'proof',
    def: 'FLM 的證明技巧：把原系統展開成更大的覆蓋圖，使同一個誠實節點在不同位置看見互相矛盾的世界，由此推出矛盾。',
    defEn: 'FLM\'s proof technique: unfold the system into a larger covering graph so the same honest node sees contradictory worlds at different positions, and derive a contradiction.',
    see: ['bivalent'],
    where: '/impossibility/sync/flm/',
  },

  // ---------------- 複雜度 ----------------
  authenticator: {
    term: 'authenticator',
    en: 'Authenticator',
    zh: '驗證器',
    category: 'cost',
    def: '用來證明訊息來源的認證資料。HotStuff 定義為 partial signature 或 signature，並以「GST 後達成一次決定的過程中，各節點收到的 authenticator 總數」衡量通訊複雜度，因為它不受傳輸拓樸影響（n 則各帶一個 authenticator 的訊息，與一則帶 n 個的相同）。',
    defEn: 'Authentication data used to prove where a message came from. HotStuff defines it as a partial signature or signature, and measures communication complexity as the total number of authenticators received by all nodes during one decision after GST, because this does not depend on the transmission topology (n messages each carrying one authenticator equal one message carrying n).',
    see: ['signature'],
    where: '/intro/problem/',
    note: '已對照 HotStuff PODC 2019 §1 的 Complexity measure。PBFT 等較早的論文也把 MAC 算作 authenticator，本條採 HotStuff 的定義。',
  },
  'good-case': {
    term: 'good-case latency',
    en: 'Good-Case Latency',
    category: 'cost',
    def: '指定的 broadcaster 誠實時，所有誠實節點 commit 所需的時間（取所有執行與對手策略中最壞的一個）。與一般的最壞情況延遲是不同的量，不能混用。',
    defEn: 'The time for all honest nodes to commit when the designated broadcaster is honest (the worst case over all executions and adversary strategies). It is a different quantity from ordinary worst-case latency and must not be confused with it.',
    see: ['responsiveness'],
    where: '/impossibility/cost/good-case/',
    note: '定義已對照 Abraham–Nayak–Ren–Xiang, PODC 2021, Definition 1（informal）。中文譯名待作者讀完原文後再決定，所以先不填 zh。',
  },
};
