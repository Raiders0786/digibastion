import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import {
  buildCategoryPostgrestFilter,
  isClassificationRelevant,
  isQuillMonitorArticle,
  isWeb3Incident,
  isWeb3SecurityDomain,
} from '@/utils/newsIncident';

const article = (overrides: Partial<NewsArticle> = {}): NewsArticle => ({
  id: 'article-1',
  title: 'Incident',
  content: 'Details',
  summary: 'Summary',
  category: 'operational-security',
  tags: [],
  severity: 'high',
  publishedAt: new Date('2026-09-27T00:00:00Z'),
  ...overrides,
});

describe('news incident classification', () => {
  it('uses the canonical incident marker and respects an explicit false value', () => {
    expect(isWeb3Incident(article({ metadata: { is_web3_incident: true } }))).toBe(true);
    expect(isWeb3Incident(article({ metadata: { is_web3_incident: false, provider: 'quillmonitor' } }))).toBe(false);
  });

  it('excludes explicit classifier rejections while preserving legacy rows', () => {
    expect(isClassificationRelevant(article())).toBe(true);
    expect(isClassificationRelevant(article({ metadata: { classification_relevant: true } }))).toBe(true);
    expect(isClassificationRelevant(article({ metadata: { classification_relevant: false } }))).toBe(false);
  });

  it('keeps a narrow provider fallback for legacy records', () => {
    expect(isWeb3Incident(article({ metadata: { provider: 'quillmonitor' } }))).toBe(true);
    expect(isWeb3Incident(article({ metadata: { data_source: 'unrelated-provider' } }))).toBe(false);
  });

  it('recognizes QuillMonitor from normalized metadata or the historical source name', () => {
    expect(isQuillMonitorArticle(article({ metadata: { provider: 'quillmonitor' } }))).toBe(true);
    expect(isQuillMonitorArticle(article({ sourceName: 'QuillMonitor' }))).toBe(true);
  });

  it('uses security_domain for the Web3 umbrella with safe legacy fallbacks', () => {
    expect(isWeb3SecurityDomain(article({ metadata: { security_domain: 'web3' } }))).toBe(true);
    expect(isWeb3SecurityDomain(article({ category: 'defi-exploits' }))).toBe(true);
    expect(isWeb3SecurityDomain(article({ metadata: { is_web3_incident: true } }))).toBe(true);
    expect(isWeb3SecurityDomain(article({ metadata: { security_domain: 'general' }, category: 'defi-exploits' }))).toBe(false);
  });

  it('builds an umbrella filter while avoiding a redundant DeFi branch', () => {
    const filter = buildCategoryPostgrestFilter(['web3-security', 'defi-exploits', 'supply-chain']);
    expect(filter).toContain('metadata->>security_domain.eq.web3');
    expect(filter).toContain('category.in.(supply-chain)');
    expect(filter).not.toContain('category.in.(defi-exploits,supply-chain)');
    expect(buildCategoryPostgrestFilter(['defi-exploits'])).toBeNull();
  });
});
