import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NEWS_CATEGORY_VALUES,
  VALID_NEWS_CATEGORIES,
} from '../../../supabase/functions/_shared/news-categories';
import {
  DEFAULT_SCOPE,
  getCategoryConfig,
  getSeverityStyle,
  isNewsCategory,
  isSeverityLevel,
  NEWS_CATEGORIES,
  NEWS_CATEGORY_CONFIG,
  parseListParam,
  parseScope,
  SEVERITY_LEVELS,
  SEVERITY_STYLES,
  THREAT_INTEL_SCOPES,
} from '@/lib/threatIntel/taxonomy';

const EDGE_FUNCTIONS_WITH_CATEGORY_ALLOWLIST = ['submit-form', 'update-subscription'];

describe('threat-intel taxonomy drift', () => {
  it('matches the server category allowlist exactly', () => {
    expect([...NEWS_CATEGORIES].sort()).toEqual([...NEWS_CATEGORY_VALUES].sort());
    expect(VALID_NEWS_CATEGORIES.size).toBe(NEWS_CATEGORIES.length);
  });

  it('has display config for every category', () => {
    expect(Object.keys(NEWS_CATEGORY_CONFIG).sort()).toEqual([...NEWS_CATEGORIES].sort());
  });

  it.each(EDGE_FUNCTIONS_WITH_CATEGORY_ALLOWLIST)(
    '%s validates categories through the shared module',
    (name) => {
      const source = readFileSync(resolve(process.cwd(), 'supabase/functions', name, 'index.ts'), 'utf8');
      expect(source).toContain('../_shared/news-categories.ts');
      expect(source).not.toMatch(/["']tools-reviews["']/);
    },
  );
});

describe('scope parsing', () => {
  it('defaults to Web3 incidents', () => {
    expect(DEFAULT_SCOPE).toBe('web3-incidents');
    expect(THREAT_INTEL_SCOPES).toEqual(['web3-incidents', 'all']);
    expect(parseScope(null)).toBe('web3-incidents');
    expect(parseScope('')).toBe('web3-incidents');
    expect(parseScope('unknown')).toBe('web3-incidents');
  });

  it('keeps explicit scopes, including legacy ?scope=web3-incidents links', () => {
    expect(parseScope('all')).toBe('all');
    expect(parseScope('web3-incidents')).toBe('web3-incidents');
  });
});

describe('parseListParam', () => {
  it('keeps allowed values once, in URL order', () => {
    expect(parseListParam('defi-exploits,web3-security,defi-exploits', NEWS_CATEGORIES))
      .toEqual(['defi-exploits', 'web3-security']);
  });

  it('drops unknown values and tolerates spaces', () => {
    expect(parseListParam(' critical , nope,high', SEVERITY_LEVELS)).toEqual(['critical', 'high']);
  });

  it('returns an empty list for missing input', () => {
    expect(parseListParam(null, SEVERITY_LEVELS)).toEqual([]);
  });
});

describe('category config', () => {
  it('returns the configured entry for known categories', () => {
    expect(getCategoryConfig('supply-chain')).toBe(NEWS_CATEGORY_CONFIG['supply-chain']);
  });

  it('returns a neutral fallback for unknown categories', () => {
    expect(getCategoryConfig('legacy-feed')).toEqual({
      name: 'Legacy Feed',
      description: 'Security news outside the standard categories',
      color: 'text-muted-foreground',
    });
    expect(getCategoryConfig('constructor').name).toBe('Constructor');
    expect(getCategoryConfig('').name).toBe('Uncategorized');
  });

  it('type-guards category and severity values', () => {
    expect(isNewsCategory('web3-security')).toBe(true);
    expect(isNewsCategory('toString')).toBe(false);
    expect(isSeverityLevel('high')).toBe(true);
    expect(isSeverityLevel('severe')).toBe(false);
  });
});

describe('severity styles', () => {
  it('defines a style for every severity, ranked critical first', () => {
    expect(Object.keys(SEVERITY_STYLES)).toEqual([...SEVERITY_LEVELS]);
    expect(SEVERITY_LEVELS.map((level) => SEVERITY_STYLES[level].rank)).toEqual([0, 1, 2, 3, 4]);
  });

  it('falls back to info styling for unknown severities', () => {
    expect(getSeverityStyle('severe')).toBe(SEVERITY_STYLES.info);
    expect(getSeverityStyle('critical').solidBadgeClass).toBe('bg-red-500 text-white');
  });
});
