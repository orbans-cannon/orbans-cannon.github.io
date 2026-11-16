# 烏爾班大砲：拜占庭容錯理論導讀

[English](README.md) | 繁體中文

依時序模型（同步、部分同步、非同步）分野的拜占庭容錯理論導讀，繁體中文，部分內容附英文版。

- 網站：<https://orbans-cannon.github.io/>
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
  en/            英文版
```

## 貢獻

歡迎開 issue 或 PR 指出錯誤。見 [CONTRIBUTORS.md](CONTRIBUTORS.md)。

流程：所有改動從 branch 開 PR，PR 以 squash merge 合併，不直接推 `main`。commit message 與 PR 標題、描述用英文（頁面內容用繁體中文）。請不要把論文 PDF 放進這個 repo。

`main` 更新後，GitHub Actions 會自動部署到 GitHub Pages。
