// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHeadingMath from './src/lib/rehype-heading-math.mjs';

/**
 * 側欄展開規則：點開一個群組時，裡面可以展開的子群組先收合，避免一次展開一大串。
 * 例外：包含目前頁面的子群組保持展開，讀者不會在側欄裡迷路。
 * 只在使用者點擊（或鍵盤啟動）summary 時觸發，不影響 Starlight 還原的展開狀態。
 */
const sidebarAccordionScript = `
document.addEventListener('click', function (e) {
  var summary = e.target.closest && e.target.closest('summary');
  if (!summary) return;
  var details = summary.parentElement;
  if (!details || details.tagName !== 'DETAILS' || !details.closest('.sidebar-content')) return;
  if (details.open) return;
  setTimeout(function () {
    details.querySelectorAll('details').forEach(function (d) {
      if (!d.querySelector('[aria-current="page"]')) d.open = false;
    });
  }, 0);
}, true);
`;

/**
 * 整個側欄往左收起／展開（桌面寬度）。
 * 在側欄右緣放一個把手按鈕；狀態存在 localStorage，頁面載入時先套用，避免閃爍。
 * 首頁每次進來都收起（不記憶），其他頁預設展開並記住選擇。右側欄（本頁內容）另有一個把手。
 * 手機寬度由 Starlight 自己的選單處理，這個按鈕在 CSS 裡只在桌面顯示。
 */
const sidebarToggleScript = `
(function () {
  // 注意：這段腳本寫在 JS 模板字串裡，反斜線會被吃掉，所以不要用正規表示式，改用字串比對。
  var path = location.pathname;
  var isHome = ['/', '/index.html', '/en', '/en/', '/en/index.html'].indexOf(path) !== -1;
  var isEn = path === '/en' || path.indexOf('/en/') === 0;
  var root = document.documentElement;
  // 左側欄：首頁每次進來都收起（不記憶，點 logo 回首頁一定是收起的）；其他頁預設展開並記住讀者的選擇。
  var KEY = 'bft-sidebar-hidden';
  var TOC_KEY = 'bft-toc-hidden';
  var stored = null;
  var tocStored = null;
  try { stored = localStorage.getItem(KEY); tocStored = localStorage.getItem(TOC_KEY); } catch (e) {}
  if (isHome || stored === '1') root.classList.add('bft-sidebar-hidden');
  if (tocStored === '1') root.classList.add('bft-toc-hidden');
  document.addEventListener('DOMContentLoaded', function () {
    function makeButton(cls) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      return b;
    }
    // 右側欄（本頁內容）的把手位置：貼在分界線左側（線外面，和左側欄的把手一樣）
    var tocBtn = null;
    function placeToc() {
      if (!tocBtn) return;
      var hidden = root.classList.contains('bft-toc-hidden');
      if (hidden) { tocBtn.style.left = ''; return; }
      var bar = document.querySelector('.right-sidebar');
      if (!bar) return;
      tocBtn.style.left = Math.round(bar.getBoundingClientRect().left - tocBtn.offsetWidth) + 'px';
    }
    if (root.hasAttribute('data-has-sidebar')) {
      var btn = makeButton('bft-sidebar-toggle');
      var sync = function () {
        var hidden = root.classList.contains('bft-sidebar-hidden');
        var label = isEn ? (hidden ? 'Show sidebar' : 'Hide sidebar') : (hidden ? '展開側欄' : '收起側欄');
        btn.setAttribute('aria-expanded', String(!hidden));
        btn.setAttribute('aria-label', label);
        btn.title = label;
        btn.textContent = hidden ? '›' : '‹';
      };
      btn.addEventListener('click', function () {
        root.classList.toggle('bft-sidebar-hidden');
        if (!isHome) {
          try { localStorage.setItem(KEY, root.classList.contains('bft-sidebar-hidden') ? '1' : '0'); } catch (e) {}
        }
        sync();
        setTimeout(placeToc, 260);
      });
      sync();
      document.body.appendChild(btn);
    }
    if (root.hasAttribute('data-has-toc')) {
      tocBtn = makeButton('bft-toc-toggle');
      var syncToc = function () {
        var hidden = root.classList.contains('bft-toc-hidden');
        var label = isEn ? (hidden ? 'Show contents' : 'Hide contents') : (hidden ? '展開本頁內容' : '收起本頁內容');
        tocBtn.setAttribute('aria-expanded', String(!hidden));
        tocBtn.setAttribute('aria-label', label);
        tocBtn.title = label;
        tocBtn.textContent = hidden ? '‹' : '›';
      };
      tocBtn.addEventListener('click', function () {
        root.classList.toggle('bft-toc-hidden');
        try { localStorage.setItem(TOC_KEY, root.classList.contains('bft-toc-hidden') ? '1' : '0'); } catch (e) {}
        syncToc();
        placeToc();
        setTimeout(placeToc, 260);
      });
      syncToc();
      document.body.appendChild(tocBtn);
      placeToc();
      window.addEventListener('resize', placeToc);
      window.addEventListener('load', placeToc);
    }
  });
})();
`;

/**
 * 品牌宋體：站名、首頁標題、內頁 h1（規則見 design.md §字體與排版）。
 * 英文用 Noto Serif、中文用 Noto Serif TC，皆粗體（TC 的撇號是全形，所以英文要另用 Latin 字型）。
 * 完整載入：Google Fonts 會把 CJK 字型依 unicode-range 切片，頁面只下載用到的片段。
 */
const brandFontHref =
  'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@700&family=Noto+Serif+TC:wght@700&display=swap';

// https://astro.build/config
export default defineConfig({
  site: 'https://orbans-cannon.github.io',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeHeadingMath],
  },
  integrations: [
    starlight({
      title: { 'zh-TW': '烏爾班大砲', en: 'Orban’s Cannon' },
      description: '繁體中文的拜占庭問題與拜占庭容錯（BFT）理論導讀：依同步、部分同步、非同步分野，涵蓋不可能性結果與 DAG-BFT。',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/orbans-cannon/orbans-cannon.github.io' }],
      editLink: { baseUrl: 'https://github.com/orbans-cannon/orbans-cannon.github.io/edit/main/' },
      defaultLocale: 'root',
      locales: {
        root: { label: '繁體中文', lang: 'zh-TW' },
        en: { label: 'English', lang: 'en' },
      },
      customCss: ['katex/dist/katex.min.css', './src/styles/custom.css'],
      head: [
        { tag: 'meta', attrs: { name: 'google-site-verification', content: 'U2TwzOtOWJiSyk-Aj0J7_TywD8BxCwvCjyo4tcPnz-I' } },
        { tag: 'script', content: sidebarAccordionScript },
        { tag: 'script', content: sidebarToggleScript },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: brandFontHref } },
      ],
      components: {
        Footer: './src/components/Footer.astro',
        LanguageSelect: './src/components/LanguageSelect.astro',
        Hero: './src/components/Hero.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      routeMiddleware: './src/route-middleware.ts',
      sidebar: [
        {
          label: '入門', translations: { en: 'Introduction' },
          collapsed: true,
          items: [
            'intro/about',
            'intro/byzantine',
            'intro/problem',
            'intro/models',
            'intro/crypto',
            'intro/rounds',
            'intro/glossary',
            'impossibility/overview',
            'intro/reading',
          ],
        },
        {
          label: '不可能性與下界', translations: { en: 'Impossibility and Lower Bounds' },
          collapsed: true,
          items: [
            'impossibility',
            'impossibility/sync/flm',
            'impossibility/async/flp',
            'impossibility/sync/round-bound',
            'impossibility/partial-sync/dls',
            'impossibility/cost/dolev-reischuk',
            'impossibility/cost/good-case',
            'impossibility/gates',
            'impossibility/quorum',
          ],
        },
        { label: '同步', translations: { en: 'Synchrony' }, collapsed: true, items: [{ autogenerate: { directory: 'sync' } }] },
        {
          label: '部分同步', translations: { en: 'Partial Synchrony' },
          collapsed: true,
          items: [{ autogenerate: { directory: 'partial-sync' } }],
        },
        { label: '非同步', translations: { en: 'Asynchrony' }, collapsed: true, items: [{ autogenerate: { directory: 'async' } }] },
        {
          label: '合流：DAG-BFT', translations: { en: 'Convergence: DAG-BFT' },
          collapsed: true,
          items: [{ autogenerate: { directory: 'convergence' } }],
        },
        { label: '前沿', translations: { en: 'Frontier' }, collapsed: true, items: [{ autogenerate: { directory: 'frontier' } }] },
      ],
    }),
  ],
});
