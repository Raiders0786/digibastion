import { describe, expect, it } from 'vitest';
import {
  INDEXABLE_INCIDENT_POSTGREST_FILTER,
  isIndexableIncidentMetadata,
  isPublishableMetadata,
  SAFE_ARTICLE_ID,
  WEEK_START,
} from './publishable';

describe('isIndexableIncidentMetadata', () => {
  it.each([
    [{ provider: 'quillmonitor', is_web3_incident: true }, true],
    [{ provider: 'quillmonitor', is_web3_incident: 'true' }, true],
    [{ provider: 'web3-incidents' }, true],                                  // legacy row, no flag
    [{ provider: 'web3' }, true],
    [{ provider: 'quillmonitor', is_web3_incident: true, duplicate_of_uid: 'qm:1' }, false],
    [{ provider: 'quillmonitor', is_web3_incident: true, duplicate_of_uid: '' }, false],
    [{ is_web3_incident: true, classification_relevant: false }, false],
    [{ is_web3_incident: true, classification_relevant: 'false' }, false],
    [{ provider: 'quillmonitor', is_web3_incident: false }, false],
    [{ provider: 'rss', is_web3_incident: false }, false],
    [{ provider: 'rss' }, false],
    [{ provider: 'slowmist' }, false],                                       // SlowMist always sets the flag
    [null, false],
    [[], false],
  ])('%j -> %s', (metadata, expected) => {
    expect(isIndexableIncidentMetadata(metadata)).toBe(expected);
  });
  it('treats rows without metadata as publishable but not indexable', () => {
    expect(isPublishableMetadata(null)).toBe(true);
    expect(isIndexableIncidentMetadata(undefined)).toBe(false);
  });
  it('wraps everything in one and() group for a single .or() call', () => {
    expect(INDEXABLE_INCIDENT_POSTGREST_FILTER.startsWith('and(')).toBe(true);
    expect(INDEXABLE_INCIDENT_POSTGREST_FILTER.endsWith(')')).toBe(true);
    expect(INDEXABLE_INCIDENT_POSTGREST_FILTER).toContain('metadata->>duplicate_of_uid.is.null');
    expect(INDEXABLE_INCIDENT_POSTGREST_FILTER).toContain('metadata->>is_web3_incident.eq.true');
    const depth = [...INDEXABLE_INCIDENT_POSTGREST_FILTER].reduce((d, c) => {
      if (d < 0) return d;
      return c === '(' ? d + 1 : c === ')' ? d - 1 : d;
    }, 0);
    expect(depth).toBe(0);
  });
  it('accepts only safe ids and week dates', () => {
    expect(SAFE_ARTICLE_ID.test('2f0c9b1e-0000-4000-8000-000000000000')).toBe(true);
    expect(SAFE_ARTICLE_ID.test('../etc/passwd')).toBe(false);
    expect(SAFE_ARTICLE_ID.test('a'.repeat(129))).toBe(false);
    expect(WEEK_START.test('2026-10-05')).toBe(true);
    expect(WEEK_START.test('2026-10-05/x')).toBe(false);
  });
});
