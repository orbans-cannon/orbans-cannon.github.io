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
 *   7. 家族樹與論文頁面的跨頁檢查（lineage.ts、refs.ts、各頁的 <Cite> 與 frontmatter）：
 *      a. 每棵樹：節點的論文存在於 papers、role 與 read 的值合法、同一欄節點不重疊、邊的鍵存在且端點是這棵樹的節點
 *      b. 論文：label 與 refs.ts 的關係、讀到 body 以上的必須有 refs.ts 條目、href（頁面）存在
 *      c. 邊：碰到 none／abstract 的節點只能留空或用 via（via 必須是 body 以上）、有內容要有 evidence、
 *         key 只能在 refine／respond／tight 上且不超過 8 個字、related 不能有 key、unchecked 不能有內容
 *      d. 讀過程度與 refs.ts 備註一致：body 以上不能寫「內容沒讀」，body 以下不能寫「讀過摘要與主要定理」
 *      e. 任何頁面的 <Cite> 引用的書目：讀過程度至少 body、備註不能是「內容沒讀」
 *      f. 孤兒頁：論文頁（impossibility、sync、partial-sync、async、convergence 的子頁）必須被某個樹的節點連到；
 *         概念頁與總覽頁（quorum、overview、gates）在白名單
 *      g. 家族樹給讀者看的文字不能有處理過程用語（與第 3 條同一份詞表）
 *      h. 「門與鑰匙」頁引用的模型總覽列號必須存在於 overview.ts
 * 警告（不擋建置，--strict 才擋）：
 *   （第 4 條「部分首頁 badge 低於子頁」已於 2026-11-17 刪除：badge 只代表首頁自己的狀態，見 CLAUDE.md）
 *   5. 中文頁沒有對應的英文頁；英文頁的 translatedFrom 早於中文頁的修改時間
 *   6. TODO、FIXME
 * 某一行確定要留著禁用詞時，在同一行加上 check-ignore（例如 {/* check-ignore *​/}）。
 * 規則的來源與理由：審查報告 F16、design.md §衝突清單、CLAUDE.md §寫作規範。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
    ...['資料夾', '我們手上', '手上沒有', '手上只有', '寫 any', '欄寫', '尚未取得', '已取得', 'PDF 已', 'PDF 還', 'papers/', '待下載清單', 'refs.ts', 'lineage.ts', 'check.mjs'].map((w) => ['zh', '處理過程用語（讀者不需要知道）', w, 'error']),
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

  // 7. 家族樹與論文頁面的跨頁檢查（資料在 src/data/lineage.ts、refs.ts）
  let LIN = null;
  let REF = null;
  let OV = null;
  try {
    LIN = await import(pathToFileURL(join(ROOT, 'src/data/lineage.ts')).href);
    REF = await import(pathToFileURL(join(ROOT, 'src/data/refs.ts')).href);
  } catch (e) {
    warn('scripts/check.mjs', `無法載入家族樹資料，略過第 7 條檢查（需要 Node 22.18 以上才能直接讀 .ts）：${e.message}`);
  }
  try {
    OV = await import(pathToFileURL(join(ROOT, 'src/data/overview.ts')).href);
  } catch {
    OV = null;
  }
  if (LIN && REF) {
    const { lineages, papers, edgeDefs } = LIN;
    const refs = REF.refs;
    const LEVELS = ['none', 'abstract', 'body', 'proof', 'reviewed'];
    const BODY_UP = ['body', 'proof', 'reviewed'];
    const KINDS = ['refine', 'respond', 'tight', 'related', 'unchecked'];
    const ROLES = ['spine', 'bridge', 'outer'];
    const NOT_READ = /內容(還)?沒讀/;
    const SRC = 'src/data/lineage.ts';
    const pageExists = (href) => {
      const p = href.split('#')[0].replace(/^\/|\/$/g, '');
      return ['mdx', 'md'].some((x) => existsSync(join(DOCS, `${p}.${x}`)) || existsSync(join(DOCS, p, `index.${x}`)));
    };
    const processWords = ['資料夾', '手上沒有', '手上只有', '尚未取得', '已取得', 'papers/', '待下載清單', 'refs.ts', 'lineage.ts', 'check.mjs', '研讀清單'];
    const visibleCheck = (where, text) => {
      for (const w of processWords) if (text.includes(w)) err(where, `處理過程用語（讀者不需要知道）：「${w}」`);
    };

    // b. 論文
    for (const [ref, p] of Object.entries(papers)) {
      const where = `${SRC}（papers.${ref}）`;
      if (!LEVELS.includes(p.read)) err(where, `read「${p.read}」不是合法的值（${LEVELS.join('、')}）`);
      if (p.label ? !!refs[ref] : !refs[ref]) err(where, `要嘛在 refs.ts（不寫 label），要嘛不在（要寫 label）`);
      if (p.label && BODY_UP.includes(p.read)) err(where, `讀到 ${p.read} 的論文必須有 refs.ts 條目`);
      if (p.href && !pageExists(p.href)) err(where, `href ${p.href} 指向不存在的頁面`);
      // d. 讀過程度與 refs 備註
      const note = refs[ref]?.note ?? '';
      if (refs[ref]) {
        if (BODY_UP.includes(p.read) && NOT_READ.test(note)) err(where, `read 是 ${p.read}，但 refs.ts 的備註還寫「內容沒讀」，兩邊要同時改`);
        if (!BODY_UP.includes(p.read) && note.includes('讀過摘要與主要定理')) err(where, `read 是 ${p.read}，但 refs.ts 的備註寫「讀過摘要與主要定理」，兩邊要同時改`);
      }
    }

    // c. 邊
    const usedEdges = new Set();
    const weak = (r) => !BODY_UP.includes(papers[r]?.read);
    for (const [k, e] of Object.entries(edgeDefs)) {
      const where = `${SRC}（edgeDefs.${k}）`;
      if (`${e.from}>${e.to}` !== k) err(where, `鍵與 from／to 不一致`);
      if (!KINDS.includes(e.kind)) err(where, `kind「${e.kind}」不是合法的值`);
      if (!papers[e.from] || !papers[e.to]) { err(where, `端點不在 papers`); continue; }
      const w = weak(e.from) || weak(e.to);
      if (w && e.change && !e.via) err(where, `碰到讀過程度低於 body 的節點，只能留空或用 via 轉述 body 以上的論文`);
      if (e.via && !BODY_UP.includes(papers[e.via]?.read)) err(where, `via「${e.via}」必須是 body 以上的論文`);
      if (!w && !e.change && e.kind !== 'unchecked') err(where, `缺「改了什麼」（change）`);
      if (e.change && !e.evidence) err(where, `有內容的邊缺 evidence（出處）`);
      if (e.kind === 'unchecked' && e.change) err(where, `unchecked 的邊不能寫內容`);
      if (w && !e.change && e.kind !== 'unchecked') err(where, `沒有內容的邊要標 unchecked`);
      if (e.key && !['refine', 'respond', 'tight'].includes(e.kind)) err(where, `key 只能出現在 refine、respond、tight 上（這條是 ${e.kind}）`);
      if (e.key && [...e.key].length > 8) err(where, `key「${e.key}」太長（約 7 字以內，最多 8 字）`);
      if (e.change) visibleCheck(where, e.change);
    }

    // a、g. 每棵樹
    for (const [tid, t] of Object.entries(lineages)) {
      const where = `${SRC}（${tid}）`;
      if (!['draft', 'reviewed'].includes(t.status)) err(where, `status「${t.status}」不是合法的值`);
      const refsInTree = new Set();
      for (const n of t.nodes) {
        if (!papers[n.ref]) { err(where, `節點「${n.ref}」不在 papers`); continue; }
        refsInTree.add(n.ref);
        if (!ROLES.includes(n.role)) err(where, `節點「${n.ref}」的 role「${n.role}」不對`);
        if (!n.tag) err(where, `節點「${n.ref}」缺 tag`);
        if (n.href && !pageExists(n.href)) err(where, `節點「${n.ref}」的 href ${n.href} 指向不存在的頁面`);
        for (const m of t.nodes) if (m !== n && m.col === n.col && Math.abs(m.row - n.row) * 5.8 < 5) err(where, `節點「${n.ref}」與「${m.ref}」在同一欄、列距太近，會重疊`);
        visibleCheck(where, n.tag);
      }
      for (const k of t.edges) {
        const e = edgeDefs[k];
        if (!e) { err(where, `邊「${k}」沒有定義（edgeDefs）`); continue; }
        usedEdges.add(k);
        if (!refsInTree.has(e.from) || !refsInTree.has(e.to)) err(where, `邊「${k}」的端點不是這棵樹的節點`);
      }
      for (const text of [t.concept, t.caption, t.keyNote, ...(t.notes ?? []), ...(t.cross ?? []).map((c) => c.text), ...t.qa.flatMap((q) => [q.q, q.a])]) {
        if (text) visibleCheck(where, text);
      }
      for (const c of t.cross ?? []) if (!pageExists(c.href)) err(where, `cross 連結 ${c.href} 指向不存在的頁面`);
    }
    for (const k of Object.keys(edgeDefs)) if (!usedEdges.has(k)) warn(`${SRC}（edgeDefs.${k}）`, `這條邊沒有被任何一棵樹使用`);

    // e. 任何頁面的 <Cite>
    for (const p of pages.filter((x) => !x.isEn)) {
      for (const m of p.text.matchAll(/<Cite\s+id="([^"]+)"/g)) {
        const id = m[1];
        const at = `${rel(p.file)}:${lineOf(p.text, m.index)}`;
        if (papers[id] && !BODY_UP.includes(papers[id].read)) err(at, `引用的「${id}」讀過程度是 ${papers[id].read}，<Cite> 至少要 body`);
        if (refs[id] && NOT_READ.test(refs[id].note ?? '')) err(at, `引用的「${id}」在 refs.ts 的備註是「內容沒讀」，不能放進頁面引用`);
      }
    }

    // f. 孤兒頁、depth、部分首頁連結
    const WHITELIST = new Set(['impossibility/quorum', 'impossibility/overview', 'impossibility/gates']);
    const hrefPaths = new Set();
    const addHref = (h) => h && hrefPaths.add(h.split('#')[0].replace(/^\/|\/$/g, ''));
    for (const p of Object.values(papers)) addHref(p.href);
    for (const t of Object.values(lineages)) for (const n of t.nodes) addHref(n.href);
    const paperPages = pages.filter((p) => !p.isEn && /^(impossibility|sync|partial-sync|async|convergence)\/[^/]+(\/[^/]+)*\.mdx?$/.test(p.sub) && !/\/index\.mdx?$/.test(p.sub));
    for (const p of paperPages) {
      const slug = p.sub.replace(/\.mdx?$/, '');
      if (WHITELIST.has(slug)) continue;
      if (!hrefPaths.has(slug)) err(rel(p.file), `孤兒頁：沒有任何家族樹的節點連到這一頁（論文頁必須有樹的節點；概念頁請加進 scripts/check.mjs 的白名單）`);
      const fm = (p.text.match(/^---\n([\s\S]*?)\n---/) ?? [, ''])[1];
      if (!/^depth:\s*(full|guide|index)\s*$/m.test(fm)) warn(rel(p.file), `論文頁沒有 depth（full／guide／index）`);
    }
    for (const part of ['sync', 'partial-sync', 'async', 'convergence']) {
      const idx = pages.find((p) => !p.isEn && p.sub === `${part}/index.mdx`);
      if (!idx) continue;
      for (const p of paperPages.filter((x) => x.sub.startsWith(part + '/'))) {
        const slug = '/' + p.sub.replace(/\.mdx?$/, '') + '/';
        if (!idx.text.includes(`](${slug}`)) warn(rel(idx.file), `部分首頁的規劃章節沒有連到 ${slug}`);
      }
    }

    // h. 「門與鑰匙」頁引用的模型總覽列號
    const gates = pages.find((p) => !p.isEn && p.sub === 'impossibility/gates.mdx');
    if (gates && OV?.overviewRows) {
      const ids = new Set(OV.overviewRows.map((r) => r.id));
      for (const m of gates.text.matchAll(/第\s*([\d、，,\s]+)\s*列/g)) {
        for (const n of m[1].split(/[、，,\s]+/).filter(Boolean)) {
          if (!ids.has(Number(n))) err(`${rel(gates.file)}:${lineOf(gates.text, m.index)}`, `引用的模型總覽第 ${n} 列不存在（overview.ts）`);
        }
      }
    }

    // i. 輪數對照表（src/data/rounds.ts）：詞彙、書目、讀過程度、連結
    let RD = null;
    try {
      RD = await import(pathToFileURL(join(ROOT, 'src/data/rounds.ts')).href);
    } catch {
      RD = null;
    }
    if (RD?.roundsRows) {
      const RSRC = 'src/data/rounds.ts';
      const V = {
        timing: ['sync', 'async', 'sync-async'],
        determinism: ['det', 'rand'],
        measure: ['lockstep', 'iteration'],
        case: ['worst', 'expected', 'good'],
        bound: ['upper', 'lower', 'tight'],
        read: ['abstract', 'body', 'proof', 'reviewed'],
      };
      const seen = new Set();
      for (const r of RD.roundsRows) {
        const at = `${RSRC}（${r.id}）`;
        if (seen.has(r.id)) err(at, `列 id 重複`);
        seen.add(r.id);
        for (const [k, vals] of Object.entries(V)) if (!vals.includes(r[k])) err(at, `${k} 必須是 ${vals.join(' / ')} 之一，目前是 ${JSON.stringify(r[k])}`);
        if (!refs[r.refId]) err(at, `refId「${r.refId}」不在 refs.ts`);
        else if (NOT_READ.test(refs[r.refId].note ?? '')) err(at, `「${r.refId}」在 refs.ts 的備註是「內容沒讀」，不能放進輪數表`);
        if (r.read === 'abstract' && r.value) err(at, `只讀到 abstract 級的列不能顯示數值`);
        if (!r.condition) err(at, `condition 必填（前提與原文用語的說明）`);
        if (!pageExists(r.href)) err(at, `href「${r.href}」對不到頁面`);
      }
    }
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
