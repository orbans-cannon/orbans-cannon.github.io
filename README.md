# 烏爾班大砲：拜占庭容錯理論導讀

依時序模型（同步、部分同步、非同步）分野的拜占庭容錯理論導讀，繁體中文。

- 作者：Allan Yang
- 協作：Cowork with Claude（Anthropic），同列 contributor
- 授權：不可商用。文字 CC BY-NC-SA 4.0，程式碼 PolyForm Noncommercial 1.0.0（見 `LICENSE`）

## 開發

```bash
npm install
npm run dev
```

## 結構

```
src/content/docs/
  intro/         入門（問題與性質、模型的定義）
  impossibility/ 不可能性與下界（總覽表、FLP、FLM、DLS、下界、Quorum 結論）
  sync/          同步
  partial-sync/  部分同步
  async/         非同步
  convergence/   合流：DAG-BFT
  frontier/      前沿
```

## 寫作規範

- 每頁開頭標示核對狀態（草稿／已核對）。
- 協議頁固定附模型卡：時序、密碼學假設、故障、確定性、問題。
- 證明依「模型 → 性質 → 引理 → 證明 → 邊界」。
- 複雜度數字註明單位與情境。
- 引用以出版版本為準，核對標題、年份、頁碼。
- **不要把論文 PDF 放進這個 repo。**

## 貢獻

歡迎開 issue 或 PR 指出錯誤。見 [CONTRIBUTORS.md](CONTRIBUTORS.md)。
