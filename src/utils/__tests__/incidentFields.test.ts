import { describe, expect, it } from 'vitest';
import {
  MAX_INCIDENT_SOURCES,
  mergeIncidentSources,
  readIncidentFields,
  type IncidentSource,
} from '../../../supabase/functions/_shared/incident-fields';

function source(provider: string, url: string | null, amount: number | null = null): IncidentSource {
  return { provider, url, label: provider, amount_usd: amount };
}

describe('readIncidentFields', () => {
  it('returns safe empty defaults for missing or non-object metadata', () => {
    const empty = {
      sources: [],
      duplicateOfUid: null,
      summaryOrigin: null,
      amountStatus: null,
      fundsReturned: null,
      incidentDate: null,
      incidentDateUnknown: false,
      verification: null,
    };
    expect(readIncidentFields(null)).toEqual(empty);
    expect(readIncidentFields(undefined)).toEqual(empty);
    expect(readIncidentFields('metadata')).toEqual(empty);
    expect(readIncidentFields([{ sources: [] }])).toEqual(empty);
  });

  it('reads every contract field from well-formed metadata', () => {
    expect(readIncidentFields({
      sources: [{ provider: 'QuillMonitor', url: 'https://example.com/report', label: 'Incident reference', amount_usd: 3_800_000 }],
      duplicate_of_uid: 'quillmonitor:abc',
      summary_origin: 'ai',
      amount_status: 'confirmed',
      funds_returned: true,
      incident_date: '2026-09-20',
      incident_date_unknown: false,
      verification_status: 'verified',
    })).toEqual({
      sources: [{ provider: 'quillmonitor', url: 'https://example.com/report', label: 'Incident reference', amount_usd: 3_800_000 }],
      duplicateOfUid: 'quillmonitor:abc',
      summaryOrigin: 'ai',
      amountStatus: 'confirmed',
      fundsReturned: true,
      incidentDate: '2026-09-20',
      incidentDateUnknown: false,
      verification: 'verified',
    });
  });

  it('maps the SlowMist provider-template origin to provider', () => {
    expect(readIncidentFields({ summary_origin: 'provider-template' }).summaryOrigin).toBe('provider');
    expect(readIncidentFields({ summary_origin: 'publisher' }).summaryOrigin).toBe('publisher');
    expect(readIncidentFields({ summary_origin: 'gpt' }).summaryOrigin).toBeNull();
  });

  it('rejects invalid enum, boolean and date values', () => {
    const fields = readIncidentFields({
      duplicate_of_uid: '   ',
      amount_status: 'estimated',
      funds_returned: 'yes',
      incident_date: '2026-02-31',
      incident_date_unknown: 'true',
      verification_status: 'pending',
    });
    expect(fields.duplicateOfUid).toBeNull();
    expect(fields.amountStatus).toBeNull();
    expect(fields.fundsReturned).toBeNull();
    expect(fields.incidentDate).toBeNull();
    expect(fields.incidentDateUnknown).toBe(false);
    expect(fields.verification).toBeNull();
  });

  it('accepts only YYYY-MM-DD incident dates', () => {
    expect(readIncidentFields({ incident_date: '2026-09-20T00:00:00Z' }).incidentDate).toBeNull();
    expect(readIncidentFields({ incident_date: 'September 20, 2026' }).incidentDate).toBeNull();
    expect(readIncidentFields({ incident_date: '2026-09-20' }).incidentDate).toBe('2026-09-20');
  });

  it('keeps only http(s) source URLs and drops malformed sources', () => {
    const fields = readIncidentFields({
      sources: [
        { provider: 'web3-incidents', url: 'javascript:alert(1)', label: 'Bad link', amount_usd: -5 },
        { provider: 'slowmist', url: 'http://example.com/a', label: '', amount_usd: Number.NaN },
        { provider: '', url: 'https://example.com/no-provider' },
        'not a source',
        null,
      ],
    });
    expect(fields.sources).toEqual([
      { provider: 'web3-incidents', url: null, label: 'Bad link', amount_usd: null },
      { provider: 'slowmist', url: 'http://example.com/a', label: 'slowmist', amount_usd: null },
    ]);
  });

  it('treats a non-array sources value as no sources', () => {
    expect(readIncidentFields({ sources: { provider: 'quillmonitor' } }).sources).toEqual([]);
  });
});

describe('mergeIncidentSources', () => {
  it('dedupes by provider and URL, keeping the first occurrence', () => {
    const merged = mergeIncidentSources(
      [source('quillmonitor', 'https://example.com/a', 3_800_000)],
      [
        source('quillmonitor', 'https://example.com/a', 4_000_000),
        source('web3-incidents', 'https://example.com/a', 3_800_000),
        source('web3-incidents', null),
        source('web3-incidents', null),
      ],
    );
    expect(merged).toEqual([
      source('quillmonitor', 'https://example.com/a', 3_800_000),
      source('web3-incidents', 'https://example.com/a', 3_800_000),
      source('web3-incidents', null),
    ]);
  });

  it(`caps the result at ${MAX_INCIDENT_SOURCES} entries`, () => {
    const incoming = Array.from({ length: 15 }, (_, index) => source('web3-incidents', `https://example.com/${index}`));
    const merged = mergeIncidentSources([], incoming);
    expect(merged).toHaveLength(MAX_INCIDENT_SOURCES);
    expect(merged[0].url).toBe('https://example.com/0');
    expect(merged[9].url).toBe('https://example.com/9');
  });
});
