/**
 * 首頁三將軍動畫的文字（繁中／英文）。
 * 劇本依 LSP 1982 第 3 節的 Fig. 1、Fig. 2：
 *   情境一：主帥忠誠、送出「攻」；副將 2 是叛徒，向副將 1 謊報「主帥說撤」。
 *   情境二：主帥是叛徒，對副將 1 說「攻」、對副將 2 說「撤」；副將 2 如實轉告。
 * 兩個情境裡副將 1 收到的訊息相同，所以分不出誰是叛徒。
 * 「主帥／副將」對應原文的 commander／lieutenant。
 */
export type Lang = 'zh-TW' | 'en';

export interface GeneralsStrings {
  commander: string;
  l1: string;
  l2: string;
  /** 傳令兵卷軸上的字：直接命令與轉述 */
  attack: string;
  retreat: string;
  saidRetreat: string;
  /** 卷軸上每個字元的估計寬度（px，字級 11） */
  glyphWidth: number;
  scenario1: string;
  scenario2: string;
  caption1: string;
  caption2: string;
  conclusion: string;
  inboxTitle: string;
  inboxCommanderAttack: string;
  inboxL2SaidRetreat: string;
  pause: string;
  play: string;
  /** 給讀螢幕器與沒有 JavaScript／減少動態時的完整說明 */
  description: string;
  /** 圖下方的出處說明；{flm}、{quorum} 會換成連結 */
  footnote: string;
  flmLink: string;
  quorumLink: string;
  /** 之後加英文版頁面時的路徑前綴 */
  linkBase: string;
}

export const generalsStrings: Record<Lang, GeneralsStrings> = {
  'zh-TW': {
    commander: '主帥',
    l1: '副將 1',
    l2: '副將 2',
    attack: '攻',
    retreat: '撤',
    saidRetreat: '「撤」',
    glyphWidth: 11.5,
    scenario1: '情境一',
    scenario2: '情境二',
    caption1: '主帥忠誠；副將 2 是叛徒，向副將 1 謊報「主帥說撤」。',
    caption2: '主帥是叛徒，對兩位副將下了不同的命令；副將 2 如實轉告。',
    conclusion: '兩個情境裡，副將 1 收到的訊息一模一樣：他分不出誰是叛徒。',
    inboxTitle: '副將 1 收到的訊息',
    inboxCommanderAttack: '主帥：攻',
    inboxL2SaidRetreat: '副將 2：「主帥說撤」',
    pause: '暫停動畫',
    play: '播放動畫',
    description:
      '動畫：三位將軍圍攻一座城，傳令兵在營帳之間傳遞「攻」或「撤」。情境一，主帥忠誠並下令進攻，副將 2 是叛徒，向副將 1 謊稱主帥說撤。情境二，主帥是叛徒，對副將 1 說攻、對副將 2 說撤，副將 2 如實轉告。兩個情境中副將 1 收到的訊息完全相同：主帥說攻、副將 2 說主帥說撤，因此他無法分辨叛徒是誰。',
    footnote:
      '改編自 LSP 1982 的三將軍論證：只用口頭訊息（沒有簽章）時，三位將軍中有一位叛徒就沒有解法。原文也提醒這只是直觀說明，嚴格證明見 {flm}；一般情形需要 {quorum}。',
    flmLink: 'FLM',
    quorumLink: 'n ≥ 3f+1',
    linkBase: '',
  },
  en: {
    commander: 'Commander',
    l1: 'Lieutenant 1',
    l2: 'Lieutenant 2',
    attack: 'attack',
    retreat: 'retreat',
    saidRetreat: '“retreat”',
    glyphWidth: 6.2,
    scenario1: 'Scenario 1',
    scenario2: 'Scenario 2',
    caption1: 'The commander is loyal. Lieutenant 2 is a traitor and tells Lieutenant 1 “he said retreat.”',
    caption2: 'The commander is a traitor and gives the two lieutenants different orders. Lieutenant 2 relays honestly.',
    conclusion: 'Lieutenant 1 receives exactly the same messages in both scenarios, with no way to tell who the traitor is.',
    inboxTitle: 'What Lieutenant 1 receives',
    inboxCommanderAttack: 'Commander: attack',
    inboxL2SaidRetreat: 'Lieutenant 2: “he said retreat”',
    pause: 'Pause animation',
    play: 'Play animation',
    description:
      'Animation: three generals besiege a city, and messengers run between their camps carrying “attack” or “retreat”. In scenario 1 the commander is loyal and orders an attack, while Lieutenant 2 is a traitor and tells Lieutenant 1 that the commander said retreat. In scenario 2 the commander is a traitor, telling Lieutenant 1 to attack and Lieutenant 2 to retreat, and Lieutenant 2 relays this honestly. In both scenarios Lieutenant 1 receives the same messages, “attack” from the commander and “he said retreat” from Lieutenant 2, so he cannot tell who the traitor is.',
    footnote:
      'Adapted from the three-generals argument of Lamport, Shostak and Pease (1982): with oral messages (no signatures), no solution works for three generals with one traitor. The paper itself warns that this reasoning is informal; see {flm} for a rigorous proof. In general, {quorum} is required.',
    flmLink: 'FLM',
    quorumLink: 'n ≥ 3f+1',
    linkBase: '/en',
  },
};
