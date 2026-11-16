/**
 * Starlight 路由中介：術語表的分類標題是 <Glossary /> 元件產生的，Starlight 的右側目錄抓不到，
 * 只會剩「概述」。這裡把七個分類補進目錄（錨點 #gl-{分類}，與 Glossary.astro 一致）。
 * design.md 衝突清單 #14。
 */
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { glossary, categoryLabel, categoryLabelEn, type Category } from './data/glossary';

/**
 * 只有章節標題或只有規劃的頁面（badge 是「大綱」「規劃中」）沒有正文，
 * 讓搜尋引擎收錄只會拉低整站的品質印象，所以加 noindex。草稿以上的頁面正常收錄。
 */
const NOINDEX_BADGES = new Set(['大綱', '規劃中', 'Outline', 'Planned']);

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const badge = route.entry.data.sidebar?.badge;
  const badgeText = typeof badge === 'string' ? badge : badge?.text;
  if (badgeText && NOINDEX_BADGES.has(badgeText)) {
    route.head.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex' }, content: '' });
  }

  // 搜尋用標題：站名保留，關鍵字放在前面（搜尋結果大約只顯示前 30 個中文字）。
  const isEnPage = route.lang?.startsWith('en');
  const brand = isEnPage ? 'Orban’s Cannon' : '烏爾班大砲';
  const seoTitle = route.entry.data.seoTitle;
  if (seoTitle) {
    const full = seoTitle.includes(brand) ? seoTitle : `${seoTitle} | ${brand}`;
    for (const h of route.head) {
      if (h.tag === 'title') h.content = full;
      if (h.tag === 'meta' && (h.attrs?.property === 'og:title' || h.attrs?.name === 'twitter:title')) {
        h.attrs.content = full;
      }
    }
  }

  // 結構化資料：首頁是 WebSite，其餘可索引頁面是 Article。沒有 git 歷史，不寫發布與修改日期。
  if (!(badgeText && NOINDEX_BADGES.has(badgeText)) && context.site) {
    const url = new URL(context.url.pathname, context.site).href;
    const inLanguage = isEnPage ? 'en' : 'zh-TW';
    const author = { '@type': 'Person', name: 'Allan Yang' };
    const isHome = context.url.pathname === '/' || context.url.pathname === '/en/';
    const data = isHome
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: brand,
          alternateName: isEnPage ? 'Byzantine Fault Tolerance: A Theory Guide' : '拜占庭問題與拜占庭容錯理論導讀',
          url,
          inLanguage,
          description: route.entry.data.description,
          author,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: route.entry.data.title,
          description: route.entry.data.description,
          url,
          inLanguage,
          author,
          isPartOf: { '@type': 'WebSite', name: brand, url: new URL(isEnPage ? '/en/' : '/', context.site).href },
        };
    route.head.push({ tag: 'script', attrs: { type: 'application/ld+json' }, content: JSON.stringify(data) });
  }
  if (!route.toc) return;
  const isEn = route.id === 'en/intro/glossary';
  if (route.id !== 'intro/glossary' && !isEn) return;
  const cats = (Object.keys(categoryLabel) as Category[]).filter((c) =>
    Object.values(glossary).some((t) => t.category === c),
  );
  route.toc.items.push(
    ...cats.map((c) => ({
      depth: 2,
      slug: `gl-${c}`,
      text: isEn ? categoryLabelEn[c] : categoryLabel[c],
      children: [],
    })),
  );
});
