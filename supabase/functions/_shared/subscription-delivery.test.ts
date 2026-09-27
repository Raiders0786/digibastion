import { describe, expect, it } from 'vitest';
import {
  formatDeliveryArticleText,
  getDeliveryPresentation,
  matchesDeliveryPreferences,
  renderIncidentContextHtml,
  safeHttpUrl,
  technologyMatches,
  type DeliverableArticle,
} from './subscription-delivery.ts';

const baseArticle: DeliverableArticle = {
  id: 'article-1',
  title: 'Protocol incident',
  summary: 'An incident summary',
  severity: 'medium',
  category: 'defi-exploits',
  link: 'https://example.com/report',
  tags: ['reentrancy'],
  affected_technologies: ['Ethereum', 'Uniswap'],
  source_name: 'QuillMonitor',
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    project_name: 'Uniswap',
    chain: 'Ethereum',
    attack_type: 'Reentrancy',
    amount_display: '$2M',
    attribution_url: 'https://www.quillaudits.com/web3-hacks-database',
  },
};

describe('subscription delivery matching', () => {
  it('treats Web3 Security as an umbrella for incident leaf categories', () => {
    expect(matchesDeliveryPreferences(baseArticle, {
      categories: ['web3-security'],
      severity_threshold: 'medium',
      content_scope: 'all',
    })).toBe(true);
  });

  it('keeps non-incident leaf categories exact', () => {
    expect(matchesDeliveryPreferences({
      ...baseArticle,
      category: 'vulnerability-disclosure',
      source_name: 'RSS',
      metadata: null,
    }, {
      categories: ['web3-security'],
      severity_threshold: 'medium',
    })).toBe(false);
  });

  it('keeps the narrow Web3/DeFi category fallback for legacy domain rows', () => {
    const legacyDefiArticle = { ...baseArticle, source_name: 'RSS', metadata: null };
    expect(matchesDeliveryPreferences(legacyDefiArticle, {
      categories: ['web3-security'],
      severity_threshold: 'medium',
      content_scope: 'all',
    })).toBe(true);
    expect(matchesDeliveryPreferences(legacyDefiArticle, {
      categories: ['web3-security'],
      severity_threshold: 'medium',
      content_scope: 'web3-incidents',
    })).toBe(false);
  });

  it('uses explicit Web3 domain metadata for non-incident umbrella matching', () => {
    expect(matchesDeliveryPreferences({
      ...baseArticle,
      source_name: 'Security Research Feed',
      metadata: { security_domain: 'web3' },
    }, {
      categories: ['web3-security'],
      severity_threshold: 'medium',
    })).toBe(true);
  });

  it('lets an explicit non-Web3 domain override legacy category fallback', () => {
    expect(matchesDeliveryPreferences({
      ...baseArticle,
      source_name: 'Enterprise Feed',
      metadata: { security_domain: 'enterprise' },
    }, {
      categories: ['web3-security'],
      severity_threshold: 'medium',
    })).toBe(false);
  });

  it('does not treat arbitrary data_source metadata as a Web3 incident', () => {
    expect(matchesDeliveryPreferences({
      ...baseArticle,
      category: 'vulnerability-disclosure',
      source_name: 'Vendor Feed',
      metadata: { data_source: 'vendor-api' },
    }, {
      categories: ['web3-security'],
      severity_threshold: 'medium',
      content_scope: 'web3-incidents',
    })).toBe(false);
  });

  it('suppresses rows explicitly marked irrelevant by reclassification', () => {
    expect(matchesDeliveryPreferences({
      ...baseArticle,
      metadata: { ...baseArticle.metadata, classification_relevant: false },
    }, {
      categories: ['web3-security'],
      severity_threshold: 'medium',
    })).toBe(false);
  });

  it('applies the Web3 incident scope independently from category', () => {
    expect(matchesDeliveryPreferences(baseArticle, {
      categories: ['defi-exploits'],
      severity_threshold: 'medium',
      content_scope: 'web3-incidents',
    })).toBe(true);
    expect(matchesDeliveryPreferences({ ...baseArticle, source_name: 'RSS', metadata: null }, {
      categories: ['defi-exploits'],
      severity_threshold: 'medium',
      content_scope: 'web3-incidents',
    })).toBe(false);
  });

  it('matches normalized technology IDs against tags and affected technologies', () => {
    expect(technologyMatches(baseArticle, ['uniswap'])).toBe(true);
    expect(technologyMatches({ ...baseArticle, affected_technologies: ['Coinbase Wallet'] }, ['coinbase-wallet'])).toBe(true);
    expect(technologyMatches({ ...baseArticle, tags: ['git'], affected_technologies: [] }, ['git'])).toBe(true);
    expect(technologyMatches({ ...baseArticle, tags: ['digital-forensics'], affected_technologies: [] }, ['git'])).toBe(false);
  });

  it('is null-safe and preserves the urgent critical/high bypass', () => {
    const nullArrays = { ...baseArticle, tags: null, affected_technologies: null };
    expect(matchesDeliveryPreferences(nullArrays, {
      categories: ['defi-exploits'], technologies: ['solana'], severity_threshold: 'medium',
    })).toBe(false);
    expect(matchesDeliveryPreferences({ ...nullArrays, severity: 'high' }, {
      categories: ['defi-exploits'], technologies: ['solana'], severity_threshold: 'high',
    })).toBe(true);
  });

  it('enforces the subscriber severity threshold', () => {
    expect(matchesDeliveryPreferences({ ...baseArticle, severity: 'high' }, {
      categories: ['defi-exploits'], severity_threshold: 'critical',
    })).toBe(false);
    expect(matchesDeliveryPreferences({ ...baseArticle, severity: 'critical' }, {
      categories: ['defi-exploits'], severity_threshold: 'critical',
    })).toBe(true);
  });
});

describe('subscription email presentation', () => {
  it('drops invalid numeric entities instead of aborting an email job', () => {
    expect(formatDeliveryArticleText({
      ...baseArticle,
      title: 'Incident &#999999999; report',
    })).toContain('Incident report');
  });

  it('renders Web3 and QuillMonitor parity in HTML and plain text', () => {
    const html = renderIncidentContextHtml(baseArticle);
    const text = formatDeliveryArticleText(baseArticle);
    expect(html).toContain('Web3 Incident');
    expect(html).toContain('Powered by QuillMonitor');
    expect(html).toContain('Uniswap · Ethereum · Reentrancy · $2M');
    expect(text).toContain('[MEDIUM · WEB3 INCIDENT]');
    expect(text).toContain('Powered by QuillMonitor: https://www.quillaudits.com/web3-hacks-database');
  });

  it('does not attribute non-QuillMonitor incident providers to QuillMonitor', () => {
    const article = {
      ...baseArticle,
      source_name: 'Web3 Incidents',
      metadata: { provider: 'web3-incidents', is_web3_incident: true },
    };
    expect(renderIncidentContextHtml(article)).toContain('Web3 Incident');
    expect(renderIncidentContextHtml(article)).not.toContain('QuillMonitor');
  });

  it('rejects unsafe article and attribution URL schemes', () => {
    expect(safeHttpUrl('javascript:alert(1)', 'https://www.digibastion.com/threat-intel/article-1'))
      .toBe('https://www.digibastion.com/threat-intel/article-1');
    const presentation = getDeliveryPresentation({
      ...baseArticle,
      link: 'data:text/html,boom',
      metadata: { ...baseArticle.metadata, attribution_url: 'javascript:alert(1)' },
    }, 'https://www.digibastion.com/threat-intel/article-1');
    expect(presentation.articleUrl).toBe('https://www.digibastion.com/threat-intel/article-1');
    expect(presentation.attributionUrl).toBe('https://www.quillaudits.com/web3-hacks-database');
  });

  it('escapes provider metadata in rendered HTML', () => {
    const html = renderIncidentContextHtml({
      ...baseArticle,
      metadata: { ...baseArticle.metadata, project_name: '<img src=x onerror=alert(1)>' },
    });
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x');
  });
});
