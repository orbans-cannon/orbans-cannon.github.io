import { defineCollection, z } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
	// 覆寫 Starlight 的介面字串（src/content/i18n/*.json）：頁尾導覽改成「上一頁／下一頁」。
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				/**
				 * 頁首重點：一兩句話寫出「這頁要記住的事」，顯示在標題正下方（PageTitle.astro）。
				 * 可含 $...$ 數學。只寫頁面正文已經寫明的結論，不要寫未核對的新敘述。
				 */
				takeaway: z.string().optional(),
				/**
				 * 搜尋結果與分頁顯示的 <title>（route-middleware.ts 套用）。頁面標題（h1、側欄）不變。
				 * 寫成讀者會搜的說法；不含站名時會自動加上「 | 烏爾班大砲」。
				 */
				seoTitle: z.string().optional(),
				/**
				 * 本頁數學符號的意思（覆蓋 src/data/symbols.ts 的預設；空字串＝本頁不提示）。
				 * 同一字母在本頁有兩種意思時，兩種都不要宣告。
				 */
				symbols: z.record(z.string(), z.string()).optional(),
			}),
		}),
	}),
};
