// Canonical news_articles.category values accepted by the subscription
// endpoints. Keep this module free of Deno and URL imports: Vitest loads it in
// src/utils/__tests__/threatIntelTaxonomy.test.ts to fail the build if the
// frontend taxonomy (src/lib/threatIntel/taxonomy.ts) drifts from it.
export const NEWS_CATEGORY_VALUES = [
  'operational-security',
  'supply-chain',
  'personal-protection',
  'web3-security',
  'defi-exploits',
  'vulnerability-disclosure',
  'tools-reviews',
] as const;

export type NewsCategoryValue = (typeof NEWS_CATEGORY_VALUES)[number];

export const VALID_NEWS_CATEGORIES: ReadonlySet<string> = new Set<string>(NEWS_CATEGORY_VALUES);
