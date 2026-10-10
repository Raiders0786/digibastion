import { describe, expect, it } from 'vitest';
import {
  finalizeQuillMonitorArticle,
  normalizeQuillMonitorIncident,
  type QuillMonitorIncident,
} from '../../../supabase/functions/_shared/quillmonitor';

const incident: QuillMonitorIncident = {
  id: 'near-intents-1',
  target: 'NEAR Intents',
  date: '2026-10-02',
  chain: 'NEAR',
  category: 'Bridge',
  attackedMethod: 'Private Key Compromise',
  amountInUsd: 3_800_000,
  description: 'An attacker used a leaked key to drain the solver.',
  reference: 'https://x.com/near/status/1',
  verificationStatus: 'verified',
  createdAt: '2026-10-02T10:00:00.000Z',
  updatedAt: '2026-10-02T12:00:00.000Z',
};
const web3Source = { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/2', label: '@zachxbt', amount_usd: 3_800_000 };

describe('QuillMonitor sources', () => {
  it('records its own source with the incident reference', () => {
    expect(normalizeQuillMonitorIncident(incident).metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://x.com/near/status/1', label: 'QuillMonitor', amount_usd: 3_800_000 },
    ]);
  });

  it('falls back to the QuillMonitor database link without a reference', () => {
    const article = normalizeQuillMonitorIncident({ ...incident, reference: '' });
    expect(article.metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://www.quillaudits.com/web3-hacks-database', label: 'QuillMonitor', amount_usd: 3_800_000 },
    ]);
  });
});

describe('finalizeQuillMonitorArticle', () => {
  const article = normalizeQuillMonitorIncident(incident);

  it('appends duplicate sources found in this sync after its own', () => {
    const finalized = finalizeQuillMonitorArticle(article, undefined, [web3Source]);
    expect(finalized.metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://x.com/near/status/1', label: 'QuillMonitor', amount_usd: 3_800_000 },
      web3Source,
    ]);
    expect(article.metadata.sources).toHaveLength(1);
  });

  it('drops previously merged sources when the lookup ran and found none', () => {
    const existing = { summary: null, metadata: { sources: [web3Source] } };
    expect(finalizeQuillMonitorArticle(article, existing, []).metadata.sources).toHaveLength(1);
  });

  it('keeps previously merged sources when the lookup was skipped', () => {
    const existing = {
      summary: null,
      metadata: {
        sources: [
          { provider: 'quillmonitor', url: 'https://old.example.com/ref', label: 'QuillMonitor', amount_usd: 1 },
          web3Source,
        ],
      },
    };
    expect(finalizeQuillMonitorArticle(article, existing, null).metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://x.com/near/status/1', label: 'QuillMonitor', amount_usd: 3_800_000 },
      web3Source,
    ]);
  });
});
