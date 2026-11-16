# Orban's Cannon: A Guide to Byzantine Fault Tolerance

English | [繁體中文](README.zh-TW.md)

A guide to Byzantine fault tolerance (BFT) organized by timing model (synchronous, partially synchronous, asynchronous). The site is written in Traditional Chinese, with English translations of part of the content.

- Site: <https://orbans-cannon.github.io/>
- Author: Allan Yang
- Collaboration: Cowork with Claude (Anthropic), listed as a contributor
- License: non-commercial. Text under CC BY-NC-SA 4.0, code under PolyForm Noncommercial 1.0.0 (see `LICENSE`)

## Development

```bash
npm install
npm run dev
```

## Structure

```
src/content/docs/
  intro/         Introduction (the problem, its properties, the timing models)
  impossibility/ Impossibility and lower bounds (overview table, FLP, FLM, DLS, bounds, quorum)
  sync/          Synchronous
  partial-sync/  Partially synchronous
  async/         Asynchronous
  convergence/   Convergence: DAG-BFT
  frontier/      Frontier
  en/            English translations
```

## Contributing

Issues and pull requests that point out errors are welcome. See [CONTRIBUTORS.md](CONTRIBUTORS.md).

Workflow: every change goes through a branch and a pull request, merged with squash merge; nothing is pushed directly to `main`. Commit messages and PR titles and descriptions are in English (page content is in Traditional Chinese). Please do not add paper PDFs to this repository.

The site is deployed to GitHub Pages by GitHub Actions whenever `main` is updated.
