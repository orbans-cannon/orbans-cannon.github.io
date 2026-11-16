#!/usr/bin/env node
/**
 * 全站檢查（元件之外的檢查）。用法：
 *   node scripts/check.mjs              原始碼檢查＋建置結果檢查（沒有 dist 時只做前者）
 *   node scripts/check.mjs --source     只做原始碼檢查（掛在 astro build 之前）
 *   node scripts/check.mjs --dist       只做建置結果檢查（掛在 astro build 之後）
 *   node scripts/check.mjs --strict     警告也算失敗
 *
 * 錯誤（exit 1）：
 *   1. 站內連結與 #錨點必須存在（讀 dist；有原始碼行號時一併指出）
 *   2. 頁面的側欄 badge 必須與模型卡的 status 一致
 *   3. 禁用詞：處理過程用語（「資料夾」「我們手上」「欄寫 any」…）、大陸用語（「軟件」「網絡」…）
 * 警告（不擋建置，--strict 才擋）：
 *   4. 部分首頁的 badge 低於子頁最高狀態
 *   5. 中文頁沒有對應的英文頁；英文頁的 translatedFrom 早於中文頁的修改時間
 *   6. TODO、FIXME
 * 某一行確定要留著禁用詞時，在同一行加上 check-ignore（例如 {/* check-ignore *​/}）。
 * 規則的來源與理由：審查報告 F16、design.md §衝突清單、CLAUDE.md §寫作規範。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'src/content/docs');
const DIST = join(ROOT, 'dist');
const args = new Set(process.argv.slice(2));
const runSource = args.has('--source') || !args.has('--dist');
const runDist = args.has('--dist') || !args.has('--source');
const strict = args.has('--strict');

const errors = [];
const warnings = [];
const rel = (p) => relative(ROOT, p).split(sep).join('/');
const err = (where, msg) => errors.push({ where, msg });
const warn = (where, msg) => warnings.push({ where, msg });

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// ---------------------------------------------------------------- 讀取內容檔
const docFiles = walk(DOCS).filter((f) => /\.mdx?$/.test(f));
const pages = docFiles.map((file) => {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = m ? m[1] : '';
  const badge = fm.match(/badge:\s*\n\s+text:\s*(.+)\n/);
  const translatedFrom = fm.match(/^translatedFrom:\s*(\S+)/m);
  const sub = rel(file).replace('src/content/docs/', '');
  return {
    file,
    text,
    sub,
    isEn: sub.startsWith('en/'),
    badge: badge ? badge[1].trim().replace(/^["']|["']$/g, '') : null,
    translatedFrom: translatedFrom ? translatedFrom[1] : null,
  };
});

// ---------------------------------------------------------------- 原始碼檢查
if (runSource) {
  const statusOfBadge = {
    大綱: 'outline', 規劃中: 'planned', 草稿: 'draft', 部分核對: 'partial', 已核對: 'verified',
    Outline: 'outline', Planned: 'planned', Draft: 'draft', 'Partially verified': 'partial', Verified: 'verified',
  };
  const rank = { outline: 0, planned: 1, draft: 2, partial: 3, verified: 4 };

  // 2. badge 與模型卡 status 一致
  for (const p of pages) {
    const card = p.text.match(/<ModelCard\b[\s\S]*?\/>/);
    if (!card || !p.badge) continue;
    const attr = card[0].match(/\bstatus="(\w+)"/);
    const status = attr ? attr[1] : 'draft'; // ModelCard 的預設
    const expected = statusOfBadge[p.badge];
    if (!expected) {
      err(rel(p.file), `側欄 badge「${p.badge}」不是已知的狀態（${Object.keys(statusOfBadge).join('、')}）`);
    } else if (expected !== status) {
      const at = attr ? lineOf(p.text, p.text.indexOf(card[0]) + card[0].indexOf(attr[0])) : lineOf(p.text, p.text.indexOf(card[0]));
      err(`${rel(p.file)}:${at}`, `側欄 badge 是「${p.badge}」（${expected}），模型卡 status 是「${status}」，兩者要一致`);
    }
  }

  // 4. 部分首頁的 badge 不低於子頁最高狀態（警告）
  const parts = new Set(pages.filter((p) => !p.isEn).map((p) => p.sub.split('/')[0]).filter((d) => d.includes('.') === false));
  for (const part of parts) {
    const idx = pages.find((p) => !p.isEn && /^[^/]+\/index\.mdx?$/.test(p.sub) && p.sub.startsWith(part + '/'));
    if (!idx || !idx.badge || !statusOfBadge[idx.badge]) continue;
    const kids = pages.filter((p) => !p.isEn && p.sub.startsWith(part + '/') && p !== idx && p.badge && statusOfBadge[p.badge]);
    if (kids.length === 0) continue;
    const top = kids.reduce((a, b) => (rank[statusOfBadge[b.badge]] > rank[statusOfBadge[a.badge]] ? b : a));
    if (rank[statusOfBadge[idx.badge]] < rank[statusOfBadge[top.badge]]) {
      warn(rel(idx.file), `部分首頁的 badge「${idx.badge}」低於子頁最高狀態「${top.badge}」（${top.sub}）`);
    }
  }

  // 5. 中英文頁對應
  const enSubs = new Set(pages.filter((p) => p.isEn).map((p) => p.sub.slice(3).replace(/\.mdx?$/, '')));
  const missing = pages
    .filter((p) => !p.isEn)
    .filter((p) => p.sub !== '404.md') // 404 是中英文同頁，不需要英文版
    .filter((p) => !enSubs.has(p.sub.replace(/\.mdx?$/, '')))
    .map((p) => p.sub);
  if (missing.length) {
    warn('src/content/docs/en/', `${missing.length} 個中文頁沒有英文版（網站會顯示中文 fallback）：${missing.slice(0, 8).join('、')}${missing.length > 8 ? '…' : ''}`);
  }
  for (const p of pages.filter((x) => x.isEn && x.translatedFrom)) {
    const zh = pages.find((x) => !x.isEn && x.sub.replace(/\.mdx?$/, '') === p.sub.slice(3).replace(/\.mdx?$/, ''));
    if (zh && statSync(zh.file).mtime > new Date(p.translatedFrom + 'T23:59:59')) {
      warn(rel(p.file), `英文頁依 ${p.translatedFrom} 的中文版翻譯，中文版之後又修改過（${zh.sub}）`);
    }
  }

  // 3、6. 禁用詞
  const rules = [
    // [適用語言, 類別, 詞, 級別]
    ...['資料夾', '我們手上', '手上沒有', '手上只有', '寫 any', '欄寫', '尚未取得', '已取得', 'PDF 已', 'PDF 還'].map((w) => ['zh', '處理過程用語（讀者不需要知道）', w, 'error']),
    ...['計算機系統', '毛病', '軟件', '網絡', '默認', '信息系統'].map((w) => ['zh', '大陸用語（本站用台灣用語）', w, 'error']),
    ...['papers folder', 'in the folder', 'says any', 'PDF obtained', 'not been obtained'].map((w) => ['en', '處理過程用語（讀者不需要知道）', w, 'error']),
    ...['TODO', 'FIXME'].map((w) => ['both', '未完成的標記', w, 'warn']),
  ];
  for (const p of pages) {
    const lines = p.text.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('check-ignore')) return;
      for (const [lang, cat, word, level] of rules) {
        if (lang === 'zh' && p.isEn) continue;
        if (lang === 'en' && !p.isEn) continue;
        if (!line.includes(word)) continue;
        (level === 'error' ? err : warn)(`${rel(p.file)}:${i + 1}`, `${cat}：「${word}」`);
      }
    });
  }
}

// ---------------------------------------------------------------- 建置結果檢查
if (runDist) {
  if (!existsSync(DIST)) {
    warn('dist/', '沒有 dist 資料夾，略過站內連結檢查（先跑 astro build）');
  } else {
    const idCache = new Map();
    const idsOf = (htmlFile) => {
      if (!idCache.has(htmlFile)) {
        const h = readFileSync(htmlFile, 'utf8');
        idCache.set(htmlFile, new Set([...h.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1])));
      }
      return idCache.get(htmlFile);
    };
    const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
    // 404.html 與 en/404/ 是 Starlight 的 404 頁，語言切換連結指向不存在的 /404/，不是內容頁
    const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html') && !f.endsWith(`${sep}404.html`) && !f.endsWith(`${sep}404${sep}index.html`));

    // 對照：dist 頁面 → 原始碼檔
    const sourceFor = (distFile) => {
      let p = rel(distFile).replace(/^dist\//, '').replace(/index\.html$/, '').replace(/\/$/, '');
      const cands = p === '' ? ['index.mdx', 'index.md'] : [`${p}.mdx`, `${p}.md`, `${p}/index.mdx`, `${p}/index.md`];
      return cands.map((c) => join(DOCS, c)).find((f) => existsSync(f));
    };

    const bad = new Map(); // key: 連結 → { reason, pages: Set, where }
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
        let href = m[1].replace(/&amp;/g, '&');
        if (!(href.startsWith('/') && !href.startsWith('//')) && !href.startsWith('#')) continue;
        const [pathPart0, ...fragParts] = href.split('#');
        const frag = fragParts.join('#');
        const pathPart = dec(pathPart0.split('?')[0]);
        if (pathPart.startsWith('/_astro/') || pathPart.startsWith('/pagefind/')) continue;
        if (pathPart && /\.[A-Za-z0-9]+$/.test(pathPart.split('/').pop())) continue; // 檔案（favicon、pdf…）
        let target = file;
        if (pathPart) {
          const t = join(DIST, pathPart, 'index.html');
          target = existsSync(t) ? t : existsSync(join(DIST, pathPart)) && statSync(join(DIST, pathPart)).isFile() ? join(DIST, pathPart) : null;
        }
        let reason = null;
        if (!target) reason = `指向不存在的頁面`;
        else if (frag && !idsOf(target).has(frag) && !idsOf(target).has(dec(frag))) reason = `指向的頁面沒有錨點 #${dec(frag)}`;
        if (!reason) continue;
        const key = href + '|' + reason;
        if (!bad.has(key)) bad.set(key, { href, reason, pages: new Set(), files: [] });
        const e = bad.get(key);
        if (!e.pages.has(rel(file))) { e.pages.add(rel(file)); e.files.push(file); }
      }
    }
    for (const { href, reason, files } of bad.values()) {
      // 盡量指出原始碼的行號：找第一個含這個連結的來源檔
      let where = rel(files[0]);
      for (const f of files) {
        const src = sourceFor(f);
        if (!src) continue;
        const text = readFileSync(src, 'utf8');
        const at = text.indexOf(href) >= 0 ? text.indexOf(href) : text.indexOf(dec(href));
        if (at >= 0) { where = `${rel(src)}:${lineOf(text, at)}`; break; }
      }
      const extra = files.length > 1 ? `（共出現在 ${files.length} 個頁面，例如 ${rel(files[0])}）` : '';
      err(where, `站內連結 ${dec(href)} ${reason}${extra}`);
    }
  }
}

// ---------------------------------------------------------------- 輸出
const fmt = (e, mark) => `${mark} ${e.where}\n    ${e.msg}`;
if (errors.length) console.error('\n' + errors.map((e) => fmt(e, '✗ 錯誤')).join('\n'));
if (warnings.length) console.warn('\n' + warnings.map((e) => fmt(e, '! 警告')).join('\n'));
const scope = [runSource && '原始碼', runDist && '建置結果'].filter(Boolean).join('＋');
console.log(`\n全站檢查（${scope}）：${errors.length} 個錯誤、${warnings.length} 個警告${strict ? '（--strict：警告也算失敗）' : ''}`);
process.exit(errors.length || (strict && warnings.length) ? 1 : 0);
