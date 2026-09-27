import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { articlesMeta, getArticleBySlug } from '../articlesData';
import { hasArticleContent } from '../articleContent';

const RELEASE_DATE = '2026-09-27';
const sitemap = readFileSync(new URL('../../../public/sitemap.xml', import.meta.url), 'utf8');

describe('article publishing data', () => {
  const articles = articlesMeta;

  it('keeps articles awaiting editorial review out of public routes', () => {
    const drafts = [
      'advanced-wallet-security',
      'blockchain-privacy-tools-2025',
      'cex-vs-dex-security-comparison',
      'defi-smart-contract-audit-checklist',
      'formal-verification-smart-contracts',
      'metamask-security-settings',
    ];

    for (const slug of drafts) {
      expect(getArticleBySlug(slug)).toBeUndefined();
      expect(sitemap).not.toContain(`/articles/${slug}</loc>`);
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

  it('keeps article metadata and sitemap slugs in exact sync', () => {
    const sitemapSlugs = Array.from(
      sitemap.matchAll(/<loc>https:\/\/www\.digibastion\.com\/articles\/([^<]+)<\/loc>/g),
      (match) => match[1],
    );
    const metadataSlugs = articles.map((article) => article.slug);

    expect(new Set(sitemapSlugs).size).toBe(sitemapSlugs.length);
    expect([...sitemapSlugs].sort()).toEqual([...metadataSlugs].sort());
  });
});
