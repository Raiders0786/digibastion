import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDynamic } from '../fetchDynamic';
import { weeklyPublicContent } from '../../../supabase/functions/_shared/weekly-test-fixtures';

const log = { warn: vi.fn(), info: vi.fn() };
const opts = { baseUrl: 'https://x.supabase.co', anonKey: 'anon', incidentLimit: 500, weeklyLimit: 26, timeoutMs: 50, log };

const row = (id: string, metadata: Record<string, unknown>) => ({
  id, title: `Incident ${id}`, summary: 's', content: '', category: 'defi-exploits', severity: 'high', tags: [], link: null,
  source_name: 'QuillMonitor', published_at: '2026-10-01T00:00:00Z', created_at: '2026-10-01T00:00:00Z', metadata,
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  log.warn.mockClear();
  log.info.mockClear();
});

describe('fetchDynamic', () => {
  it('returns nothing and warns once when fetch throws', async () => {
    const result = await fetchDynamic({ ...opts, fetchImpl: () => Promise.reject(new Error('offline')) });
    expect(result).toEqual({ incidents: [], weekly: [] });
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn.mock.calls[0][0]).toMatch(/^\[seo\] dynamic pages skipped: /);
  });

  it('gives up on a hanging server within the timeout', async () => {
    const hang = (_: unknown, init?: RequestInit) => new Promise<Response>((_, reject) =>
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    const started = Date.now();
    const result = await fetchDynamic({ ...opts, fetchImpl: hang as typeof fetch });
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(result).toEqual({ incidents: [], weekly: [] });
  });

  it('gives up even when the fetch ignores the abort signal', async () => {
    const deaf = () => new Promise<Response>(() => undefined);
    const started = Date.now();
    await fetchDynamic({ ...opts, fetchImpl: deaf as typeof fetch });
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(log.warn).toHaveBeenCalledTimes(1);
  });

  it('drops merged and non-incident rows even if the server returns them', async () => {
    const rows = [
      row('good', { provider: 'quillmonitor', is_web3_incident: true }),
      row('dupe', { provider: 'quillmonitor', is_web3_incident: true, duplicate_of_uid: 'qm:9' }),
      row('../x', { provider: 'quillmonitor', is_web3_incident: true }),
      row('rss', { provider: 'rss', is_web3_incident: false }),
      row('retracted', { provider: 'quillmonitor', is_web3_incident: true, classification_relevant: false }),
    ];
    const fetchImpl = vi.fn(async (url: string) => json(url.includes('/rest/v1/news_articles') ? rows : []));
    const result = await fetchDynamic({ ...opts, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.incidents.map((i) => i.id)).toEqual(['good']);
    const firstUrl = String(fetchImpl.mock.calls[0][0]);
    expect(firstUrl).toContain(encodeURIComponent('metadata->>duplicate_of_uid.is.null'));
    expect(firstUrl).toContain('order=created_at.desc');
    expect(firstUrl).toContain('limit=500');
  });

  it('sends the anon key on every request', async () => {
    const fetchImpl = vi.fn(async () => json([]));
    await fetchDynamic({ ...opts, fetchImpl: fetchImpl as unknown as typeof fetch });
    for (const call of fetchImpl.mock.calls as unknown as [string, RequestInit][]) {
      const headers = call[1].headers as Record<string, string>;
      expect(headers.apikey).toBe('anon');
      expect(headers.Authorization).toBe('Bearer anon');
    }
  });

  it('skips weekly pages quietly when the archive RPC is not deployed yet', async () => {
    const fetchImpl = vi.fn(async (url: string) => (url.includes('list_weekly_newsletters') ? json({ message: 'not found' }, 404) : json([])));
    const result = await fetchDynamic({ ...opts, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.weekly).toEqual([]);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('loads each listed week and keeps only valid issues', async () => {
    const content = weeklyPublicContent();
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('list_weekly_newsletters')) {
        return json([{ week_start: '2026-10-05', incident_count: 9, loss_usd: 1 }, { week_start: '2026-09-28' }, { week_start: '2026-09-29' }]);
      }
      if (url.includes('get_weekly_newsletter')) {
        const { p_week_start: week } = JSON.parse(String(init?.body));
        return json(week === '2026-10-05' ? { content, generated_at: '2026-10-12T00:10:00Z' } : null);
      }
      return json([]);
    });
    const result = await fetchDynamic({ ...opts, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.weekly.map((w) => w.content.weekStart)).toEqual(['2026-10-05']);
    expect(result.weekly[0].generatedAt).toBe('2026-10-12T00:10:00Z');
    const weeklyCalls = fetchImpl.mock.calls.filter(([url]) => String(url).includes('get_weekly_newsletter'));
    expect(weeklyCalls).toHaveLength(2);
  });

  it('keeps incidents already fetched when the weekly step fails', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/rest/v1/news_articles')) return json([row('good', { provider: 'quillmonitor', is_web3_incident: true })]);
      throw new Error('connection reset');
    });
    const result = await fetchDynamic({ ...opts, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.incidents.map((i) => i.id)).toEqual(['good']);
    expect(result.weekly).toEqual([]);
    expect(log.warn).toHaveBeenCalledTimes(1);
  });

  it('retries a 500 answer and keeps the incidents it then gets', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async (url: string) => {
      if (!url.includes('/rest/v1/news_articles')) return json([]);
      calls += 1;
      return calls === 1 ? json({ message: 'boom' }, 500) : json([row('good', { provider: 'quillmonitor', is_web3_incident: true })]);
    });
    const result = await fetchDynamic({ ...opts, retryDelayMs: 0, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(calls).toBe(2);
    expect(result.incidents.map((i) => i.id)).toEqual(['good']);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('gives up after two retries of a 5xx and does not retry a 4xx', async () => {
    const always503 = vi.fn(async () => json({ message: 'down' }, 503));
    const down = await fetchDynamic({ ...opts, retryDelayMs: 0, fetchImpl: always503 as unknown as typeof fetch });
    expect(always503).toHaveBeenCalledTimes(3);
    expect(down).toEqual({ incidents: [], weekly: [] });
    expect(log.warn.mock.calls[0][0]).toBe('[seo] dynamic pages skipped: HTTP 503 from /rest/v1/news_articles');

    const always400 = vi.fn(async () => json({ message: 'bad' }, 400));
    await fetchDynamic({ ...opts, retryDelayMs: 0, fetchImpl: always400 as unknown as typeof fetch });
    expect(always400).toHaveBeenCalledTimes(1);
  });
});
