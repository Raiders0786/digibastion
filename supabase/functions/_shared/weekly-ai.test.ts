import { describe, expect, it } from 'vitest';
import type { WeeklyTotals } from './newsletter-content.ts';
import {
  ALLOWED_WEEKLY_MODELS,
  buildWeeklyGroundedInput,
  buildWeeklyPrompt,
  DEFAULT_WEEKLY_MODEL,
  parseWeeklyModelOutput,
  requestWeeklyCompletion,
  resolveWeeklyModel,
} from './weekly-ai.ts';
import { WEEKLY_PLACEHOLDERS } from './weekly-validator.ts';
import { WEEK_START, weeklyItem as item, weeklyVulnerability as vuln } from './weekly-test-fixtures.ts';

const totals: WeeklyTotals = {
  lossUsd: 4_200_000, previousLossUsd: 0, unconfirmedLossUsd: 0, incidentCount: 1, unconfirmedCount: 1,
  fundsReturnedCount: 0, lateReportCount: 0,
  byAttackType: [{ key: 'bridge exploit', label: 'Bridge Exploit', count: 1, lossUsd: 4_200_000 }],
  byChain: [{ key: 'ethereum', label: 'Ethereum', count: 1, lossUsd: 4_200_000 }],
};

const top = [
  item({ summary: 'Attackers drained the bridge; see https://evil.example.com/post and www.foo.io for details.' }),
  item({ uid: 'u2', status: 'unconfirmed', amountUsd: null, chain: null }),
];
const vulnerabilities = [vuln({ title: 'CVE-2026-1234 at https://nvd.nist.gov/x' })];

const grounded = () => buildWeeklyGroundedInput({ weekStart: WEEK_START, totals, top, vulnerabilities });

describe('buildWeeklyGroundedInput', () => {
  it('keeps only the plan fields and lists the placeholders that have values', () => {
    const input = grounded();
    expect(Object.keys(input.top[0]).sort()).toEqual(
      ['attackType', 'chain', 'fundsReturned', 'incidentDate', 'placeholders', 'projectName', 'sourceName', 'status', 'summary', 'uid'],
    );
    expect(Object.keys(input.vulnerabilities[0]).sort()).toEqual(['cveId', 'sourceName', 'summary', 'title', 'uid']);
    expect(input.top[0].placeholders).toEqual(['project', 'loss', 'chain', 'attack', 'date', 'status', 'source']);
    expect(input.top[1].placeholders).toEqual(['project', 'attack', 'date', 'status', 'source']);
    expect(input.placeholders.trends).toContain('week_loss');
    expect(input.placeholders.trends).not.toContain('previous_week_loss');
  });
});

describe('buildWeeklyPrompt', () => {
  it('contains only input fields and no URLs', () => {
    const prompt = buildWeeklyPrompt(grounded());
    const all = `${prompt.system}\n${prompt.user}`;
    expect(all).not.toMatch(/https?:\/\/|www\.|\.io\b|\.gov\b|\.com\b/);
    expect(all).not.toContain('Example Protocol loses funds'); // the title is not an input field for incidents
    expect(all).not.toContain('threat-intel'); // no incident URLs
    const json = prompt.user.slice(prompt.user.indexOf('{'));
    expect(Object.keys(JSON.parse(json)).sort()).toEqual(['placeholders', 'top', 'totals', 'vulnerabilities', 'weekStart']);
  });

  it('lists every placeholder and the unconfirmed rule', () => {
    const { system } = buildWeeklyPrompt(grounded());
    for (const name of [...WEEKLY_PLACEHOLDERS.item, ...WEEKLY_PLACEHOLDERS.trends, ...WEEKLY_PLACEHOLDERS.vulnerabilities]) {
      expect(system).toContain(`{${name}}`);
    }
    expect(system).toMatch(/unconfirmed/);
    expect(system).toMatch(/reported/);
  });
});

describe('parseWeeklyModelOutput', () => {
  const uids = ['quillmonitor:abc', 'u2'];
  const valid = {
    top: [
      { uid: 'quillmonitor:abc', what: 'a', action: 'b' },
      { uid: 'u2', what: 'c', action: 'd' },
    ],
    trends: 't',
    vulnerabilities: 'v',
  };

  it('accepts well-formed output, also inside a code fence', () => {
    expect(parseWeeklyModelOutput(JSON.stringify(valid), uids)).toEqual(valid);
    expect(parseWeeklyModelOutput(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``, uids)).toEqual(valid);
  });

  it('rejects malformed JSON', () => {
    expect(parseWeeklyModelOutput('{"top": [', uids)).toBeNull();
    expect(parseWeeklyModelOutput('not json', uids)).toBeNull();
    expect(parseWeeklyModelOutput(JSON.stringify({ ...valid, trends: 3 }), uids)).toBeNull();
  });

  it('rejects missing, extra and duplicate uids', () => {
    expect(parseWeeklyModelOutput(JSON.stringify({ ...valid, top: valid.top.slice(0, 1) }), uids)).toBeNull();
    expect(parseWeeklyModelOutput(JSON.stringify({ ...valid, top: [...valid.top, { uid: 'x', what: 'e', action: 'f' }] }), uids)).toBeNull();
    expect(parseWeeklyModelOutput(JSON.stringify({ ...valid, top: [valid.top[0], valid.top[0]] }), uids)).toBeNull();
  });
});

describe('resolveWeeklyModel', () => {
  it('uses an allowed override and falls back to the default', () => {
    expect(DEFAULT_WEEKLY_MODEL).toBe('google/gemini-2.5-pro');
    expect(ALLOWED_WEEKLY_MODELS).toContain(DEFAULT_WEEKLY_MODEL);
    expect(resolveWeeklyModel('google/gemini-2.5-flash')).toBe('google/gemini-2.5-flash');
    expect(resolveWeeklyModel(' evil/model ')).toBe(DEFAULT_WEEKLY_MODEL);
    expect(resolveWeeklyModel(undefined)).toBe(DEFAULT_WEEKLY_MODEL);
  });
});

describe('requestWeeklyCompletion', () => {
  const prompt = { system: 's', user: 'u' };
  const respond = (status: number, body: unknown): typeof fetch =>
    (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it('returns the tool-call arguments and sends a JSON-only request', async () => {
    let sent: Record<string, unknown> = {};
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { name: 'write_weekly', arguments: '{"a":1}' } }] } }] }));
    }) as unknown as typeof fetch;
    const result = await requestWeeklyCompletion({ fetchImpl, apiKey: 'secret-key', model: DEFAULT_WEEKLY_MODEL, prompt });
    expect(result).toEqual({ ok: true, raw: '{"a":1}' });
    expect(sent.temperature).toBe(0.2);
    expect(sent.model).toBe(DEFAULT_WEEKLY_MODEL);
    expect(sent.tool_choice).toEqual({ type: 'function', function: { name: 'write_weekly' } });
  });

  it('falls back to message content when there is no tool call', async () => {
    const result = await requestWeeklyCompletion({ fetchImpl: respond(200, { choices: [{ message: { content: '{"b":2}' } }] }), apiKey: 'k', model: 'm', prompt });
    expect(result).toEqual({ ok: true, raw: '{"b":2}' });
  });

  it('maps 402, 429, other errors, empty output and timeouts to codes without the key', async () => {
    expect(await requestWeeklyCompletion({ fetchImpl: respond(402, {}), apiKey: 'k', model: 'm', prompt })).toEqual({ ok: false, error: 'ai_payment_required' });
    expect(await requestWeeklyCompletion({ fetchImpl: respond(429, {}), apiKey: 'k', model: 'm', prompt })).toEqual({ ok: false, error: 'ai_rate_limited' });
    expect(await requestWeeklyCompletion({ fetchImpl: respond(500, { error: 'secret-key' }), apiKey: 'secret-key', model: 'm', prompt })).toEqual({ ok: false, error: 'ai_http_500' });
    expect(await requestWeeklyCompletion({ fetchImpl: respond(200, { choices: [] }), apiKey: 'k', model: 'm', prompt })).toEqual({ ok: false, error: 'ai_empty_output' });
    const hanging = ((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })) as unknown as typeof fetch;
    expect(await requestWeeklyCompletion({ fetchImpl: hanging, apiKey: 'k', model: 'm', prompt, timeoutMs: 5 })).toEqual({ ok: false, error: 'ai_timeout' });
  });
});
