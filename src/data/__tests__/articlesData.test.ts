import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { articlesMeta, getArticleBySlug } from '../articlesData';
import { hasArticleContent } from '../articleContent';
import { retiredArticleRedirects } from '../articleRedirects';
import { coreGuideEnhancements } from '../contentBatches/coreGuideEnhancements';
import { legacyProtocolEnhancements } from '../contentBatches/legacyProtocolEnhancements';
import { legacyScamEnhancements } from '../contentBatches/legacyScamEnhancements';
import { legacyWalletEnhancements } from '../contentBatches/legacyWalletEnhancements';

const RELEASE_DATE = '2026-09-27';
const sitemap = readFileSync(new URL('../../../public/sitemap.xml', import.meta.url), 'utf8');
const vercelConfig = JSON.parse(
  readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'),
) as {
  redirects: Array<{ source: string; destination: string; permanent: boolean }>;
};
const editorialEnhancements = {
  ...coreGuideEnhancements,
  ...legacyWalletEnhancements,
  ...legacyScamEnhancements,
  ...legacyProtocolEnhancements,
};

describe('article publishing data', () => {
  const articles = articlesMeta;

  it('keeps the documented public article inventory in sync', () => {
    expect(articles).toHaveLength(71);
  });

  it('publishes former drafts only after the complete editorial upgrade', () => {
    const upgradedDrafts = [
      'advanced-wallet-security',
      'blockchain-privacy-tools-2025',
      'cex-vs-dex-security-comparison',
      'defi-smart-contract-audit-checklist',
      'formal-verification-smart-contracts',
      'metamask-security-settings',
    ];

    for (const slug of upgradedDrafts) {
      const article = getArticleBySlug(slug);

      expect(article?.status).toBe('published');
      expect(article?.modifiedAt).toBe(RELEASE_DATE);
      expect(article?.summary?.length).toBeGreaterThanOrEqual(100);
      expect(article?.keyTakeaways).toHaveLength(3);
      expect(article?.sources?.length).toBeGreaterThanOrEqual(2);
      expect(hasArticleContent(slug)).toBe(true);
      expect(sitemap).toContain(`/articles/${slug}</loc>`);
    }
  });

  it('uses unique, URL-safe slugs with full article content', () => {
    const slugs = articles.map((article) => article.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(hasArticleContent(slug), `${slug} has no article content`).toBe(true);
    }
  });

  it('requires an explicit publishing decision and complete searchable metadata', () => {
    for (const article of articles) {
      expect(article.status).toBe('published');
      expect(article.title.trim().length).toBeGreaterThanOrEqual(20);
      expect(article.description.trim().length).toBeGreaterThanOrEqual(70);
      expect(article.tags.length).toBeGreaterThanOrEqual(3);
      expect(new Set(article.tags.map((tag) => tag.toLowerCase())).size).toBe(article.tags.length);
      expect(article.readTime).toMatch(/^\d+ min read$/);
      expect(article.author.trim().length).toBeGreaterThan(0);
      expect(article.category.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses valid publication dates and HTTPS source links', () => {
    for (const article of articles) {
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.modifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.publishedAt <= article.modifiedAt).toBe(true);
      expect(article.modifiedAt <= RELEASE_DATE).toBe(true);

      for (const source of article.sources ?? []) {
        expect(source.title.trim().length).toBeGreaterThan(0);
        expect(source.publisher.trim().length).toBeGreaterThan(0);
        expect(() => new URL(source.url)).not.toThrow();
        expect(new URL(source.url).protocol).toBe('https:');
      }
    }
  });

  it('holds release-day publications to the source-backed editorial standard', () => {
    const releaseArticles = articles.filter((article) => article.publishedAt === RELEASE_DATE);

    expect(releaseArticles.length).toBeGreaterThanOrEqual(15);
    for (const article of releaseArticles) {
      expect(article.summary?.trim().length, `${article.slug} needs an answer-first summary`).toBeGreaterThanOrEqual(100);
      expect(article.keyTakeaways, `${article.slug} needs key takeaways`).toHaveLength(3);
      expect(article.sources?.length, `${article.slug} needs primary sources`).toBeGreaterThanOrEqual(2);
      expect(new Set(article.sources?.map((source) => source.url)).size).toBe(article.sources?.length);
    }
  });

  it('holds every upgraded legacy guide to the source-backed editorial standard', () => {
    const enhancedSlugs = Object.keys(editorialEnhancements);

    expect(enhancedSlugs).toHaveLength(52);
    for (const slug of enhancedSlugs) {
      const article = getArticleBySlug(slug);

      expect(article, `${slug} must be publicly available`).toBeDefined();
      expect(article?.modifiedAt).toBe(RELEASE_DATE);
      expect(article?.summary?.trim().length, `${slug} needs an answer-first summary`).toBeGreaterThanOrEqual(100);
      expect(article?.keyTakeaways, `${slug} needs exactly three takeaways`).toHaveLength(3);
      expect(article?.sources?.length, `${slug} needs at least two sources`).toBeGreaterThanOrEqual(2);
      expect(new Set(article?.sources?.map((source) => source.url)).size).toBe(article?.sources?.length);
      expect(hasArticleContent(slug), `${slug} needs upgraded content`).toBe(true);
      expect(sitemap).toMatch(
        new RegExp(`/articles/${slug}</loc>\\s*<lastmod>${RELEASE_DATE}</lastmod>`),
      );
    }
  });

  it('keeps article metadata and sitemap slugs in exact sync', () => {
    const sitemapSlugs = Array.from(
      sitemap.matchAll(/<loc>https:\/\/www\.digibastion\.com\/articles\/([^<]+)<\/loc>/g),
      (match) => match[1],
    );
    const metadataSlugs = articles.map((article) => article.slug);

    expect(new Set(sitemapSlugs).size).toBe(sitemapSlugs.length);
    expect([...sitemapSlugs].sort()).toEqual([...metadataSlugs].sort());
  });

  it('keeps retired article redirects aligned and pointed at published guides', () => {
    for (const [retiredSlug, destination] of Object.entries(retiredArticleRedirects)) {
      expect(destination).toMatch(/^\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*$/);

      const destinationSlug = destination.slice('/articles/'.length);
      expect(getArticleBySlug(destinationSlug), `${destination} must be published`).toBeDefined();
      expect(hasArticleContent(destinationSlug), `${destination} needs article content`).toBe(true);

      expect(vercelConfig.redirects).toContainEqual({
        source: `/articles/${retiredSlug}`,
        destination,
        permanent: true,
      });
    }
  });
});
