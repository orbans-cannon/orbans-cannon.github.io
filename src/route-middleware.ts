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
